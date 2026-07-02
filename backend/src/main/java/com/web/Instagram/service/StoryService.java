package com.web.Instagram.service;

import com.web.Instagram.dto.story.StoryResponse;
import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryArchive;
import com.web.Instagram.entity.StoryLike;
import com.web.Instagram.entity.StoryReply;
import com.web.Instagram.entity.StoryView;
import com.web.Instagram.entity.User;
import com.web.Instagram.entity.SavedStory;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.HighlightRepository;
import com.web.Instagram.repository.StoryArchiveRepository;
import com.web.Instagram.repository.StoryLikeRepository;
import com.web.Instagram.repository.StoryReplyRepository;
import com.web.Instagram.repository.StoryRepository;
import com.web.Instagram.repository.StoryMusicRepository;
import com.web.Instagram.repository.StoryViewRepository;
import com.web.Instagram.repository.SavedStoryRepository;
import com.web.Instagram.repository.ShareRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final StoryLikeRepository storyLikeRepository;
    private final StoryReplyRepository storyReplyRepository;
    private final StoryViewRepository storyViewRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final FollowRepository followRepository;
    private final SavedStoryRepository savedStoryRepository;
    private final StoryArchiveRepository storyArchiveRepository;
    private final StoryMusicRepository storyMusicRepository;
    private final HighlightRepository highlightRepository;
    private final ShareRepository shareRepository;

    public List<StoryResponse> getActiveStories(Long currentUserId) {
        User currentUser = getUserOrThrow(currentUserId);
        List<User> followedUsers = followRepository.findByFollowerId(currentUserId)
                .stream().map(f -> f.getFollowing()).toList();
        List<Story> stories = storyRepository.findActiveStoriesByFollowedUsers(LocalDateTime.now(), followedUsers, currentUser);
        return batchToResponse(stories, currentUserId);
    }

    public StoryResponse createStory(Long userId, String caption, MultipartFile media) {
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

        return toResponse(storyRepository.save(story), userId);
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

    public List<User> getStoryLikes(Long storyId) {
        Story story = getStoryOrThrow(storyId);
        return storyLikeRepository.findByStory(story).stream()
                .map(StoryLike::getUser)
                .collect(java.util.stream.Collectors.toList());
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

    @Transactional
    public void deleteStory(Long storyId, Long userId) {
        Story story = getStoryOrThrow(storyId);

        if (!story.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can delete only your own story");
        }

        deleteStoryReferences(story);
        storyRepository.delete(story);
    }

    @Transactional
    public void deleteStoriesAndHighlightsForUser(Long userId) {
        highlightRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .forEach(highlightRepository::delete);
        storyRepository.findByUserId(userId).forEach(story -> {
            deleteStoryReferences(story);
            storyRepository.delete(story);
        });
    }

    @Transactional
    public void trackView(Long storyId, Long userId) {
        Story story = getStoryOrThrow(storyId);
        if (story.getUser() != null && story.getUser().getId().equals(userId)) {
            return;
        }
        if (!storyViewRepository.existsByStoryIdAndUserId(storyId, userId)) {
            try {
                User user = getUserOrThrow(userId);
                storyViewRepository.save(StoryView.builder()
                    .story(story)
                    .user(user)
                    .build());
            } catch (DataIntegrityViolationException ignored) {
            }
        }
    }

    public List<StoryView> getStoryViews(Long storyId) {
        return storyViewRepository.findByStoryIdOrderByViewedAtDesc(storyId);
    }

    public long getViewCount(Long storyId) {
        return storyViewRepository.countByStoryId(storyId);
    }

    private List<StoryResponse> batchToResponse(List<Story> stories, Long currentUserId) {
        if (stories.isEmpty()) return List.of();
        List<Long> ids = stories.stream().map(Story::getId).toList();

        Map<Long, Long> likeCounts = storyLikeRepository.countByStoryIdIn(ids).stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));
        Map<Long, Long> viewCounts = storyViewRepository.countByStoryIdIn(ids).stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));
        Set<Long> likedIds = Set.copyOf(storyLikeRepository.findLikedStoryIds(ids, currentUserId));

        return stories.stream().map(story -> {
            User user = story.getUser();
            var music = story.getMusicId() != null
                    ? storyMusicRepository.findById(story.getMusicId()).orElse(null)
                    : null;
            Long sid = story.getId();
            return StoryResponse.builder()
                    .id(sid)
                    .mediaUrl(story.getMediaUrl())
                    .mediaType(story.getMediaType())
                    .caption(story.getCaption())
                    .createdAt(story.getCreatedAt())
                    .expiresAt(story.getExpiresAt())
                    .user(StoryResponse.StoryUser.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .fullName(user.getFullName())
                            .profilePicture(user.getProfilePicture())
                            .build())
                    .likeCount(likeCounts.getOrDefault(sid, 0L))
                    .likedByCurrentUser(likedIds.contains(sid))
                    .viewCount(viewCounts.getOrDefault(sid, 0L))
                    .musicId(story.getMusicId())
                    .musicTitle(music != null ? music.getTitle() : null)
                    .musicArtist(music != null ? music.getArtist() : null)
                    .musicAudioUrl(music != null ? music.getAudioUrl() : null)
                    .build();
        }).toList();
    }

    private StoryResponse toResponse(Story story, Long currentUserId) {
        return batchToResponse(List.of(story), currentUserId).getFirst();
    }

    @Transactional
    public SavedStory saveStory(Long userId, Long storyId) {
        if (savedStoryRepository.existsByUserIdAndStoryId(userId, storyId)) {
            throw new RuntimeException("Story already saved");
        }
        User user = getUserOrThrow(userId);
        Story story = getStoryOrThrow(storyId);
        return savedStoryRepository.save(SavedStory.builder().user(user).story(story).build());
    }

    @Transactional
    public void unsaveStory(Long userId, Long storyId) {
        savedStoryRepository.deleteByUserIdAndStoryId(userId, storyId);
    }

    public List<SavedStory> getSavedStories(Long userId) {
        return savedStoryRepository.findByUserIdOrderBySavedAtDesc(userId);
    }

    @Transactional
    public StoryArchive archiveStory(Long storyId, Long userId) {
        Story story = getStoryOrThrow(storyId);
        if (!story.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can archive only your own story");
        }

        StoryArchive archive = StoryArchive.builder()
                .user(story.getUser())
                .mediaUrl(story.getMediaUrl())
                .mediaType(story.getMediaType())
                .caption(story.getCaption())
                .archivedAt(LocalDateTime.now())
                .build();

        StoryArchive savedArchive = storyArchiveRepository.save(archive);
        deleteStoryReferences(story);
        storyRepository.delete(story);
        return savedArchive;
    }

    public List<StoryArchive> getArchivedStories(Long userId) {
        return storyArchiveRepository.findByUserIdOrderByArchivedAtDesc(userId);
    }

    @Transactional
    public void deleteArchivedStory(Long archiveId, Long userId) {
        StoryArchive archive = storyArchiveRepository.findById(archiveId)
                .orElseThrow(() -> new RuntimeException("Archived story not found"));
        if (!archive.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        storyArchiveRepository.delete(archive);
    }

    @Transactional
    public Story restoreArchivedStory(Long archiveId, Long userId) {
        StoryArchive archive = storyArchiveRepository.findById(archiveId)
                .orElseThrow(() -> new RuntimeException("Archived story not found"));
        if (!archive.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        Story story = Story.builder()
                .user(archive.getUser())
                .mediaUrl(archive.getMediaUrl())
                .mediaType(archive.getMediaType())
                .caption(archive.getCaption())
                .build();
        story = storyRepository.save(story);
        storyArchiveRepository.delete(archive);
        return story;
    }

    @Transactional
    public void setMusic(Long storyId, Long musicId, Long userId) {
        Story story = getStoryOrThrow(storyId);
        if (!story.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        storyMusicRepository.findById(musicId)
                .orElseThrow(() -> new RuntimeException("Music not found"));
        story.setMusicId(musicId);
        storyRepository.save(story);
    }

    private Story getStoryOrThrow(Long storyId) {
        return storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
    }

    private void deleteStoryReferences(Story story) {
        Long storyId = story.getId();
        highlightRepository.findByStoriesId(storyId).forEach(highlight -> {
            highlight.getStories().removeIf(existing -> existing.getId().equals(storyId));
            highlightRepository.save(highlight);
        });
        savedStoryRepository.deleteByStoryId(storyId);
        shareRepository.deleteByStoryId(storyId);
        storyLikeRepository.deleteByStory(story);
        storyReplyRepository.deleteByStory(story);
        storyViewRepository.deleteByStory(story);
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
