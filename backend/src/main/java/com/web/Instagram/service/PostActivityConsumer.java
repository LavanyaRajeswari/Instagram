package com.web.Instagram.service;

import com.web.Instagram.dto.feed.PostActivityEvent;
import com.web.Instagram.entity.Activity;
import com.web.Instagram.entity.Post;
import com.web.Instagram.repository.ActivityRepository;
import com.web.Instagram.repository.PostRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostActivityConsumer {

    private final ActivityRepository activityRepository;
    private final PostRepository postRepository;

    private final ConcurrentHashMap<Long, Delta> buffer = new ConcurrentHashMap<>();

    @Getter
    @AllArgsConstructor
    public static class Delta {
        private final int likes;
        private final int comments;
        private final int shares;

        public Delta addLike(int val) {
            return new Delta(this.likes + val, this.comments, this.shares);
        }

        public Delta addComment(int val) {
            return new Delta(this.likes, this.comments + val, this.shares);
        }

        public Delta addShare(int val) {
            return new Delta(this.likes, this.comments, this.shares + val);
        }
    }

    @KafkaListener(topics = "${app.kafka.topic.post-activity:post-activity-events}", 
                   containerFactory = "kafkaListenerContainerFactory")
    public void consumeEvent(PostActivityEvent event) {
        log.info("Received event from Kafka: {}", event);
        if (event == null || event.getPostId() == null) return;

        Long postId = event.getPostId();
        String type = event.getEventType();

        if (type == null) return;

        switch (type) {
            case "LIKE" -> buffer.compute(postId, (k, v) -> v == null ? new Delta(1, 0, 0) : v.addLike(1));
            case "UNLIKE" -> buffer.compute(postId, (k, v) -> v == null ? new Delta(-1, 0, 0) : v.addLike(-1));
            case "COMMENT_ADD" -> buffer.compute(postId, (k, v) -> v == null ? new Delta(0, 1, 0) : v.addComment(1));
            case "COMMENT_DELETE" -> buffer.compute(postId, (k, v) -> v == null ? new Delta(0, -1, 0) : v.addComment(-1));
            case "SHARE" -> buffer.compute(postId, (k, v) -> v == null ? new Delta(0, 0, 1) : v.addShare(1));
        }
    }

    @Scheduled(fixedDelayString = "${app.feed.flush-interval-ms:3000}")
    @Transactional
    public void flushBuffer() {
        if (buffer.isEmpty()) return;

        log.info("Flushing post activity buffer of size: {}", buffer.size());
        Map<Long, Delta> snapshot = new HashMap<>();
        for (Long key : buffer.keySet()) {
            Delta val = buffer.remove(key);
            if (val != null) {
                snapshot.put(key, val);
            }
        }

        if (snapshot.isEmpty()) return;

        List<Activity> existingActivities = activityRepository.findByPostIdIn(snapshot.keySet());
        Map<Long, Activity> activityMap = existingActivities.stream()
                .collect(Collectors.toMap(Activity::getPostId, a -> a));

        List<Long> missingPostIds = snapshot.keySet().stream()
                .filter(id -> !activityMap.containsKey(id))
                .toList();

        Map<Long, Post> postMap = new HashMap<>();
        if (!missingPostIds.isEmpty()) {
            List<Post> posts = postRepository.findAllById(missingPostIds);
            posts.forEach(p -> postMap.put(p.getId(), p));
        }

        List<Activity> toSave = new ArrayList<>();

        for (Map.Entry<Long, Delta> entry : snapshot.entrySet()) {
            Long postId = entry.getKey();
            Delta delta = entry.getValue();

            Activity activity = activityMap.get(postId);
            if (activity == null) {
                Post post = postMap.get(postId);
                if (post == null) {
                    log.warn("Post not found for ID: {}, skipping activity creation.", postId);
                    continue;
                }
                activity = Activity.builder()
                        .postId(postId)
                        .likeCount(0L)
                        .commentCount(0L)
                        .shareCount(0L)
                        .createdAt(post.getCreatedAt() != null ? post.getCreatedAt() : LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
            }

            activity.setLikeCount(Math.max(0L, activity.getLikeCount() + delta.getLikes()));
            activity.setCommentCount(Math.max(0L, activity.getCommentCount() + delta.getComments()));
            activity.setShareCount(Math.max(0L, activity.getShareCount() + delta.getShares()));
            activity.setUpdatedAt(LocalDateTime.now());

            toSave.add(activity);
        }

        if (!toSave.isEmpty()) {
            activityRepository.saveAll(toSave);
            log.info("Successfully saved/updated {} activity records.", toSave.size());
        }
    }
}
