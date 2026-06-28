package com.web.Instagram.controller.api;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.web.Instagram.dto.comment.CommentResponse;
import com.web.Instagram.service.CommentService;
import com.web.Instagram.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class CommentRestController {

    private final CommentService commentService;
    private final UserService userService;

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            Principal principal,
            @PathVariable Long postId,
            @RequestParam(required = false) String text,
            @RequestBody(required = false) Map<String, String> body) {
        String commentText = text != null ? text : (body != null ? body.get("text") : null);
        if (commentText == null || commentText.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = currentUserId(principal);
        return ResponseEntity.ok(commentService.addComment(userId, postId, commentText));
    }

    @PostMapping("/{postId}/comments/{parentCommentId}/replies")
    public ResponseEntity<CommentResponse> addReply(
            Principal principal,
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @RequestParam(required = false) String text,
            @RequestBody(required = false) Map<String, String> body) {
        String replyText = text != null ? text : (body != null ? body.get("text") : null);
        if (replyText == null || replyText.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = currentUserId(principal);
        return ResponseEntity.ok(commentService.addReply(userId, postId, parentCommentId, replyText));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long postId,
            Principal principal) {
        Long userId = principal != null ? userService.getCurrentUser(principal.getName()).getId() : null;
        return ResponseEntity.ok(commentService.getComments(postId, userId));
    }

    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<CommentResponse>> getReplies(
            @PathVariable Long commentId,
            Principal principal) {
        Long userId = principal != null ? userService.getCurrentUser(principal.getName()).getId() : null;
        return ResponseEntity.ok(commentService.getReplies(commentId, userId));
    }

    @GetMapping("/{postId}/comments/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentCount(postId));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deletePostComment(
            Principal principal,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        Long userId = currentUserId(principal);
        commentService.deleteComment(postId, commentId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            Principal principal,
            @PathVariable Long commentId) {
        Long userId = currentUserId(principal);
        commentService.deleteComment(null, commentId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<Void> likeComment(
            Principal principal,
            @PathVariable Long commentId) {
        Long userId = currentUserId(principal);
        commentService.likeComment(userId, commentId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<Void> unlikeComment(
            Principal principal,
            @PathVariable Long commentId) {
        Long userId = currentUserId(principal);
        commentService.unlikeComment(userId, commentId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/comments/{commentId}/likes")
    public ResponseEntity<Long> getCommentLikes(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.getCommentLikeCount(commentId));
    }

    @GetMapping("/comments/{commentId}/like/status")
    public ResponseEntity<Boolean> isCommentLiked(
            Principal principal,
            @PathVariable Long commentId) {
        Long userId = currentUserId(principal);
        return ResponseEntity.ok(commentService.isCommentLiked(userId, commentId));
    }

    private Long currentUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userService.getCurrentUser(principal.getName()).getId();
    }
}
