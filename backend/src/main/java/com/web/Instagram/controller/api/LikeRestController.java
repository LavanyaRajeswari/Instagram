package com.web.Instagram.controller.api;

import com.web.Instagram.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class LikeRestController {

    private final LikeService likeService;

    @GetMapping("/{postId}/likes")
    public long getLikes(@PathVariable Long postId) {
        return likeService.getLikeCount(postId);
    }

    @PostMapping("/{postId}/like")
    public String likePost(@RequestParam Long userId, @PathVariable Long postId) {
        likeService.likePost(userId, postId);
        return "Post liked";
    }

    @DeleteMapping("/{postId}/like")
    public String unlikePost(@RequestParam Long userId, @PathVariable Long postId) {
        likeService.unlikePost(userId, postId);
        return "Post unliked";
    }

    @GetMapping("/{postId}/like/status")
    public boolean isLiked(@PathVariable Long postId, @RequestParam Long userId) {
        return likeService.isLiked(userId, postId);
    }
}