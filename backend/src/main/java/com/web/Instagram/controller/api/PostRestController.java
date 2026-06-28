package com.web.Instagram.controller.api;

import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.service.PostService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostRestController {

    private final PostService postService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(Principal principal, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(filterVisible(postService.getAllPosts(pageable), principal, pageable));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<PostResponse>> getFeed(Principal principal, @PageableDefault(size = 20) Pageable pageable) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(postService.getFeed(userId, pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<PostResponse>> getUserPosts(
            @PathVariable Long userId,
            Principal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        String requesterUsername = principal != null ? principal.getName() : null;
        if (!userService.canViewUserPosts(requesterUsername, userId)) {
            return ResponseEntity.ok(new PageImpl<>(Collections.emptyList(), pageable, 0));
        }
        return ResponseEntity.ok(postService.getUserPosts(userId, pageable));
    }

    @GetMapping("/explore")
    public ResponseEntity<Page<PostResponse>> getExplorePosts(Principal principal, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(filterVisible(postService.getExplorePosts(pageable), principal, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPosts(Principal principal, @RequestParam String query, @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(filterVisible(postService.searchPosts(query.trim(), pageable), principal, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id, Principal principal) {
        PostResponse post = postService.getPost(id);
        String requesterUsername = principal != null ? principal.getName() : null;
        if (!userService.canViewUserPosts(requesterUsername, post.getUser().getId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(post);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<PostResponse> createPost(
            Principal principal,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) MultipartFile[] images,
            @RequestParam(required = false) Long musicId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(postService.createPost(userId, caption, images, musicId));
    }

    @PostMapping("/{id}/repost")
    public ResponseEntity<PostResponse> repost(
            Principal principal,
            @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(postService.repost(userId, id));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<PostResponse> editPost(
            Principal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) MultipartFile[] images,
            @RequestParam(required = false) Long musicId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(postService.editPost(id, caption, images, musicId, userId));
    }

    @PutMapping("/{id}/caption")
    public ResponseEntity<PostResponse> updateCaption(
            Principal principal,
            @PathVariable Long id,
            @RequestParam String caption) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(postService.updateCaption(id, caption, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            Principal principal,
            @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postService.deletePost(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/insights")
    public ResponseEntity<Map<String, Object>> getPostInsights(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostInsights(id));
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<Map<String, Object>> getPostAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostAnalytics(id));
    }

    @PutMapping("/{id}/visibility")
    public ResponseEntity<Void> setVisibility(
            Principal principal,
            @PathVariable Long id,
            @RequestParam String visibility) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postService.setVisibility(id, visibility, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/comments/disable")
    public ResponseEntity<Void> disableComments(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postService.setCommentsDisabled(id, true, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/comments/enable")
    public ResponseEntity<Void> enableComments(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postService.setCommentsDisabled(id, false, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/hide-likes")
    public ResponseEntity<Void> hideLikeCount(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postService.setHideLikeCount(id, true, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/show-likes")
    public ResponseEntity<Void> showLikeCount(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postService.setHideLikeCount(id, false, userId);
        return ResponseEntity.ok().build();
    }

    private Page<PostResponse> filterVisible(Page<PostResponse> posts, Principal principal, Pageable pageable) {
        String requesterUsername = principal != null ? principal.getName() : null;
        List<PostResponse> visiblePosts = posts.getContent().stream()
                .filter(post -> post.getUser() != null)
                .filter(post -> userService.canViewUserPosts(requesterUsername, post.getUser().getId()))
                .toList();
        return new PageImpl<>(visiblePosts, pageable, visiblePosts.size());
    }

}
