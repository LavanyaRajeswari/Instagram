package com.web.Instagram.service;

import com.web.Instagram.dto.highlight.HighlightResponse;
import com.web.Instagram.dto.story.StoryResponse;
import com.web.Instagram.entity.Highlight;
import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.HighlightRepository;
import com.web.Instagram.repository.StoryRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HighlightService {

    private final HighlightRepository highlightRepository;
    private final UserRepository userRepository;
    private final StoryRepository storyRepository;

    public List<HighlightResponse> getUserHighlights(Long userId) {
        return highlightRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public HighlightResponse createHighlight(Long userId, String title, List<Long> storyIds, String coverUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Story> stories = storyRepository.findAllById(storyIds);

        Highlight highlight = Highlight.builder()
                .title(title)
                .user(user)
                .coverUrl(coverUrl)
                .stories(stories)
                .build();

        return toResponse(highlightRepository.save(highlight));
    }

    @Transactional
    public HighlightResponse updateHighlight(Long highlightId, Long userId, String title, List<Long> storyIds, String coverUrl) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Highlight not found"));

        if (!highlight.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this highlight");
        }

        if (title != null) highlight.setTitle(title);
        if (coverUrl != null) highlight.setCoverUrl(coverUrl);
        if (storyIds != null) {
            List<Story> stories = storyRepository.findAllById(storyIds);
            highlight.setStories(stories);
        }

        return toResponse(highlightRepository.save(highlight));
    }

    private HighlightResponse toResponse(Highlight h) {
        List<Long> storyIds = h.getStories() != null
                ? h.getStories().stream().map(Story::getId).toList()
                : List.of();
        return HighlightResponse.builder()
                .id(h.getId())
                .title(h.getTitle())
                .coverUrl(h.getCoverUrl())
                .storyIds(storyIds)
                .build();
    }

    @Transactional
    public void addStoryToHighlight(Long highlightId, Long storyId, Long userId) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new RuntimeException("Highlight not found"));
        if (!highlight.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        if (!highlight.getStories().contains(story)) {
            highlight.getStories().add(story);
            highlightRepository.save(highlight);
        }
    }

    @Transactional
    public void removeStoryFromHighlight(Long highlightId, Long storyId, Long userId) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new RuntimeException("Highlight not found"));
        if (!highlight.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));
        highlight.getStories().remove(story);
        highlightRepository.save(highlight);
    }

    public List<Story> getHighlightStories(Long highlightId) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new RuntimeException("Highlight not found"));
        return highlight.getStories();
    }

    public List<StoryResponse> getHighlightStoryResponses(Long highlightId, Long currentUserId) {
        return getHighlightStories(highlightId)
                .stream()
                .map(story -> toStoryResponse(story, currentUserId))
                .toList();
    }

    private StoryResponse toStoryResponse(Story story, Long currentUserId) {
        User user = story.getUser();
        return StoryResponse.builder()
                .id(story.getId())
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
                .build();
    }

    @Transactional
    public void deleteHighlight(Long highlightId, Long userId) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Highlight not found"));
        if (!highlight.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this highlight");
        }
        highlightRepository.deleteById(highlightId);
    }
}
