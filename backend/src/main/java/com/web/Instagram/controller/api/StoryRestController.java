package com.web.Instagram.controller.api;

import com.web.Instagram.dto.story.StoryResponse;
import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryArchive;
import com.web.Instagram.entity.StoryReply;
import com.web.Instagram.entity.StoryView;
import com.web.Instagram.service.StoryService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stories")
public class StoryRestController {

    private final StoryService storyService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<StoryResponse>> getActiveStories(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        List<StoryResponse> stories = storyService.getActiveStories(userId);
        return ResponseEntity.ok(stories);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<StoryResponse> createStory(
            Principal principal,
            @RequestParam(required = false) String caption,
            @RequestParam MultipartFile media) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(storyService.createStory(userId, caption, media));
    }

    @PostMapping("/{storyId}/like")
    public ResponseEntity<Void> likeStory(Principal principal, @PathVariable Long storyId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        storyService.likeStory(storyId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{storyId}/like")
    public ResponseEntity<Void> unlikeStory(Principal principal, @PathVariable Long storyId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        storyService.unlikeStory(storyId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{storyId}/liked")
    public ResponseEntity<Boolean> isLiked(Principal principal, @PathVariable Long storyId) {
        if (principal == null) return ResponseEntity.ok(false);
        try {
            Long userId = userService.getCurrentUser(principal.getName()).getId();
            return ResponseEntity.ok(storyService.isLiked(storyId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(false);
        }
    }

    @GetMapping("/{storyId}/likes")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.getLikeCount(storyId));
    }

    @GetMapping("/{storyId}/likes/users")
    public ResponseEntity<List<com.web.Instagram.entity.User>> getStoryLikes(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.getStoryLikes(storyId));
    }

    @PostMapping("/{storyId}/reply")
    public ResponseEntity<StoryReply> replyToStory(
            Principal principal,
            @PathVariable Long storyId,
            @RequestParam String text) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(storyService.replyToStory(storyId, userId, text));
    }

    @GetMapping("/{storyId}/replies")
    public ResponseEntity<List<StoryReply>> getReplies(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.getReplies(storyId));
    }

    @PostMapping("/{storyId}/view")
    public ResponseEntity<Void> trackView(Principal principal, @PathVariable Long storyId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        storyService.trackView(storyId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{storyId}/views")
    public ResponseEntity<List<StoryView>> getStoryViews(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.getStoryViews(storyId));
    }

    @GetMapping("/{storyId}/views/count")
    public ResponseEntity<Long> getViewCount(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.getViewCount(storyId));
    }

    @GetMapping("/{storyId}/viewers")
    public ResponseEntity<List<Map<String, Object>>> getStoryViewers(Principal principal, @PathVariable Long storyId) {
        if (principal == null) return ResponseEntity.ok(List.of());
        Long userId;
        try {
            userId = userService.getCurrentUser(principal.getName()).getId();
        } catch (RuntimeException e) {
            return ResponseEntity.ok(List.of());
        }
        List<StoryView> views = storyService.getStoryViews(storyId);
        List<Map<String, Object>> result = views.stream()
        .filter(v -> v.getUser() == null || !v.getUser().getId().equals(userId))
        .map(v -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", v.getId());
            m.put("viewedAt", v.getViewedAt());
            if (v.getUser() != null) {
                m.put("userId", v.getUser().getId());
                m.put("username", v.getUser().getUsername());
                m.put("fullName", v.getUser().getFullName());
                m.put("profilePicture", v.getUser().getProfilePicture());
            }
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{storyId}/archive")
    public ResponseEntity<StoryArchive> archiveStory(Principal principal, @PathVariable Long storyId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(storyService.archiveStory(storyId, userId));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<StoryArchive>> getArchivedStories(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            Long userId = userService.getCurrentUser(principal.getName()).getId();
            return ResponseEntity.ok(storyService.getArchivedStories(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @DeleteMapping("/archived/{archiveId}")
    public ResponseEntity<Void> deleteArchivedStory(Principal principal, @PathVariable Long archiveId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        storyService.deleteArchivedStory(archiveId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/archived/{archiveId}/restore")
    public ResponseEntity<Story> restoreArchivedStory(Principal principal, @PathVariable Long archiveId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(storyService.restoreArchivedStory(archiveId, userId));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<Void> deleteStory(Principal principal, @PathVariable Long storyId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        storyService.deleteStory(storyId, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{storyId}/music")
    public ResponseEntity<Void> setMusic(
            Principal principal,
            @PathVariable Long storyId,
            @RequestParam Long musicId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        storyService.setMusic(storyId, musicId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{storyId}/save")
    public ResponseEntity<Void> saveStory(Principal principal, @PathVariable Long storyId) {
        storyService.saveStory(
                userService.getCurrentUser(principal.getName()).getId(), storyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{storyId}/save")
    public ResponseEntity<Void> unsaveStory(Principal principal, @PathVariable Long storyId) {
        storyService.unsaveStory(
                userService.getCurrentUser(principal.getName()).getId(), storyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/saved")
    public ResponseEntity<List<com.web.Instagram.entity.SavedStory>> getSavedStories(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            return ResponseEntity.ok(storyService.getSavedStories(
                    userService.getCurrentUser(principal.getName()).getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
