package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryReply;
import com.web.Instagram.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stories")
public class StoryRestController {

    private final StoryService storyService;

    @GetMapping
    public List<Story> getActiveStories() {
        return storyService.getActiveStories();
    }

    @PostMapping(consumes = "multipart/form-data")
    public Story createStory(
            @RequestParam Long userId,
            @RequestParam(required = false) String caption,
            @RequestParam MultipartFile media
    ) {
        return storyService.createStory(userId, caption, media);
    }

    @PostMapping("/{storyId}/like")
    public void likeStory(@PathVariable Long storyId, @RequestParam Long userId) {
        storyService.likeStory(storyId, userId);
    }

    @DeleteMapping("/{storyId}/like")
    public void unlikeStory(@PathVariable Long storyId, @RequestParam Long userId) {
        storyService.unlikeStory(storyId, userId);
    }

    @GetMapping("/{storyId}/liked")
    public boolean isLiked(@PathVariable Long storyId, @RequestParam Long userId) {
        return storyService.isLiked(storyId, userId);
    }

    @GetMapping("/{storyId}/likes")
    public long getLikeCount(@PathVariable Long storyId) {
        return storyService.getLikeCount(storyId);
    }

    @PostMapping("/{storyId}/reply")
    public StoryReply replyToStory(
            @PathVariable Long storyId,
            @RequestParam Long userId,
            @RequestParam String text
    ) {
        return storyService.replyToStory(storyId, userId, text);
    }

    @GetMapping("/{storyId}/replies")
    public List<StoryReply> getReplies(@PathVariable Long storyId) {
        return storyService.getReplies(storyId);
    }

    @DeleteMapping("/{storyId}")
    public void deleteStory(@PathVariable Long storyId, @RequestParam Long userId) {
        storyService.deleteStory(storyId, userId);
    }
}