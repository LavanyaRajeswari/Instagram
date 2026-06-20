package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Post;
import com.web.Instagram.service.SavedPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class SavedPostRestController {

    private final SavedPostService savedPostService;

    @PostMapping("/{postId}/save")
    public String savePost(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        savedPostService.savePost(userId, postId);
        return "Post saved";
    }

    @DeleteMapping("/{postId}/save")
    public String unsavePost(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        savedPostService.unsavePost(userId, postId);
        return "Post unsaved";
    }

    @GetMapping("/{postId}/save/status")
    public boolean isPostSaved(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        return savedPostService.isPostSaved(userId, postId);
    }

    @GetMapping("/saved")
    public List<Post> getSavedPosts(@RequestParam Long userId) {
        return savedPostService.getSavedPosts(userId);
    }
}