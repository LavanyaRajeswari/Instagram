package com.web.Instagram.service;

import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryLike;
import com.web.Instagram.entity.StoryReply;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.StoryLikeRepository;
import com.web.Instagram.repository.StoryReplyRepository;
import com.web.Instagram.repository.StoryRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final StoryLikeRepository storyLikeRepository;
    private final StoryReplyRepository storyReplyRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public List<Story> getActiveStories() {
        return storyRepository.findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now());
    }

    public Story createStory(Long userId, String caption, MultipartFile media) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String mediaUrl = cloudinaryService.uploadStoryMedia(media);

        String mediaType = media.getContentType() != null && media.getContentType().startsWith("video")
                ? "VIDEO"
                : "IMAGE";

        Story story = Story.builder()
                .user(user)
                .caption(caption)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .build();

        return storyRepository.save(story);
    }

    @Transactional
    public void likeStory(Long storyId, Long userId) {
        Story story = getStoryOrThrow(storyId);
        User user = getUserOrThrow(userId);

        if (!storyLikeRepository.existsByStoryAndUser(story, user)) {
            storyLikeRepository.save(
                    StoryLike.builder()
                            .story(story)
                            .user(user)
                            .build()
            );
        }
    }

    @Transactional
    public void unlikeStory(Long storyId, Long userId) {
        Story story = getStoryOrThrow(storyId);
        User user = getUserOrThrow(userId);
        storyLikeRepository.deleteByStoryAndUser(story, user);
    }

    public boolean isLiked(Long storyId, Long userId) {
        return storyLikeRepository.existsByStoryAndUser(
                getStoryOrThrow(storyId),
                getUserOrThrow(userId)
        );
    }

    public long getLikeCount(Long storyId) {
        return storyLikeRepository.countByStory(getStoryOrThrow(storyId));
    }

    public StoryReply replyToStory(Long storyId, Long userId, String text) {
        Story story = getStoryOrThrow(storyId);
        User user = getUserOrThrow(userId);

        StoryReply reply = StoryReply.builder()
                .story(story)
                .user(user)
                .text(text)
                .build();

        return storyReplyRepository.save(reply);
    }

    public List<StoryReply> getReplies(Long storyId) {
        return storyReplyRepository.findByStoryOrderByCreatedAtAsc(getStoryOrThrow(storyId));
    }

    public void deleteStory(Long storyId, Long userId) {
        Story story = getStoryOrThrow(storyId);

        if (!story.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can delete only your own story");
        }

        storyRepository.delete(story);
    }

    private Story getStoryOrThrow(Long storyId) {
        return storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}