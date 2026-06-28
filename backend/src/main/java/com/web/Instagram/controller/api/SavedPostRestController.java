package com.web.Instagram.controller.api;

import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.service.SavedPostService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class SavedPostRestController {

    private final SavedPostService savedPostService;
    private final UserService userService;

    @PostMapping("/{postId}/save")
    public ResponseEntity<Void> savePost(Principal principal, @PathVariable Long postId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        savedPostService.savePost(userId, postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}/save")
    public ResponseEntity<Void> unsavePost(Principal principal, @PathVariable Long postId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        savedPostService.unsavePost(userId, postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}/save/status")
    public ResponseEntity<Boolean> isPostSaved(Principal principal, @PathVariable Long postId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(savedPostService.isPostSaved(userId, postId));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<PostResponse>> getSavedPosts(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(savedPostService.getSavedPosts(userId));
    }
}