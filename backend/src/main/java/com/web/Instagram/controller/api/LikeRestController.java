package com.web.Instagram.controller.api;

import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.service.LikeService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class LikeRestController {

    private final LikeService likeService;
    private final UserService userService;

    @GetMapping("/{postId}/likes")
    public ResponseEntity<Long> getLikes(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.getLikeCount(postId));
    }

    @GetMapping("/{postId}/likes/users")
    public ResponseEntity<List<UserResponse>> getLikesUsers(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.getUsersWhoLikedPost(postId));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> likePost(Principal principal, @PathVariable Long postId) {
        Long userId = currentUserId(principal);
        likeService.likePost(userId, postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<Void> unlikePost(Principal principal, @PathVariable Long postId) {
        Long userId = currentUserId(principal);
        likeService.unlikePost(userId, postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}/like/status")
    public ResponseEntity<Boolean> isLiked(Principal principal, @PathVariable Long postId) {
        Long userId = currentUserId(principal);
        return ResponseEntity.ok(likeService.isLiked(userId, postId));
    }

    private Long currentUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userService.getCurrentUser(principal.getName()).getId();
    }
}