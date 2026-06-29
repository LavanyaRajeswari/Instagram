package com.web.Instagram.service;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.Tag;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.TagRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    public List<String> extractMentions(String text) {
        List<String> mentions = new ArrayList<>();
        if (text == null || text.isBlank()) return mentions;
        Matcher matcher = MENTION_PATTERN.matcher(text);
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
    }

    @Transactional
    public void saveMentionTags(String text, Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) return;
        List<String> usernames = extractMentions(text);
        if (usernames.isEmpty()) return;

        List<User> mentionedUsers = userRepository.findAllByUsernameIn(usernames);
        if (mentionedUsers.isEmpty()) return;

        List<Long> alreadyTaggedUserIds = tagRepository.findByPostId(postId).stream()
            .map(t -> t.getUser().getId())
            .toList();

        List<Tag> newTags = new ArrayList<>();
        Long postOwnerId = (post.getUser() != null) ? post.getUser().getId() : null;
        for (User user : mentionedUsers) {
            if (alreadyTaggedUserIds.contains(user.getId())) continue;
            newTags.add(Tag.builder().post(post).user(user).x(0.0).y(0.0).build());
            if (postOwnerId != null) {
                try {
                    notificationService.createNotification(
                        user.getId(), postOwnerId, "TAG", postId, null, "tagged you in a post"
                    );
                } catch (Exception ignored) {}
            }
        }
        if (!newTags.isEmpty()) {
            tagRepository.saveAll(newTags);
        }
    }

    @Transactional
    public void tagUserInPost(Long postId, Long taggedByUserId, Long userId, Double x, Double y) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (tagRepository.existsByPostIdAndUserId(postId, userId)) return;
        Tag tag = Tag.builder()
            .post(post)
            .user(user)
            .x(x)
            .y(y)
            .build();
        tagRepository.save(tag);
        try {
            if (!userId.equals(taggedByUserId)) {
                notificationService.createNotification(
                    userId,
                    taggedByUserId,
                    "TAG",
                    postId,
                    null,
                    "tagged you in a post"
                );
            }
        } catch (Exception ignored) {}
    }

    public List<Tag> getPostTags(Long postId) {
        return tagRepository.findByPostId(postId);
    }

    @Transactional
    public void removeTagsByPost(Long postId) {
        tagRepository.deleteByPostId(postId);
    }

    public List<Tag> getUserTags(Long userId) {
        return tagRepository.findByUserId(userId);
    }

    public List<Long> getTaggedPostIds(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();

        LinkedHashSet<Long> postIds = new LinkedHashSet<>();
        tagRepository.findByUserId(userId).stream()
            .filter(tag -> tag.getPost() != null)
            .map(tag -> tag.getPost().getId())
            .forEach(postIds::add);

        postRepository.findByCaptionMentioningUsername(user.getUsername()).stream()
            .filter(post -> extractMentions(post.getCaption()).stream()
                .anyMatch(mention -> mention.equalsIgnoreCase(user.getUsername())))
            .map(Post::getId)
            .forEach(postIds::add);

        return new ArrayList<>(postIds);
    }

    public long getUserTagCount(Long userId) {
        return tagRepository.countByUserId(userId);
    }
}
