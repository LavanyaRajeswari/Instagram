package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Comment;
import com.web.Instagram.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class CommentRestController {

    private final CommentService commentService;

    @PostMapping("/{postId}/comments")
    public Comment addComment(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestParam String text
    ) {
        return commentService.addComment(userId, postId, text);
    }

    @PostMapping("/{postId}/comments/{parentCommentId}/replies")
    public Comment addReply(
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @RequestParam Long userId,
            @RequestParam String text
    ) {
        return commentService.addReply(userId, postId, parentCommentId, text);
    }

    @GetMapping("/{postId}/comments")
    public List<Comment> getComments(
            @PathVariable Long postId,
            @RequestParam(required = false) Long userId
    ) {
        return commentService.getComments(postId, userId);
    }

    @GetMapping("/comments/{commentId}/replies")
    public List<Comment> getReplies(
            @PathVariable Long commentId,
            @RequestParam(required = false) Long userId
    ) {
        return commentService.getReplies(commentId, userId);
    }

    @GetMapping("/{postId}/comments/count")
    public long getCommentCount(@PathVariable Long postId) {
        return commentService.getCommentCount(postId);
    }

    @DeleteMapping("/comments/{commentId}")
    public String deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return "Comment deleted";
    }

    @PostMapping("/comments/{commentId}/like")
    public String likeComment(
            @PathVariable Long commentId,
            @RequestParam Long userId
    ) {
        commentService.likeComment(userId, commentId);
        return "Comment liked";
    }

    @DeleteMapping("/comments/{commentId}/like")
    public String unlikeComment(
            @PathVariable Long commentId,
            @RequestParam Long userId
    ) {
        commentService.unlikeComment(userId, commentId);
        return "Comment unliked";
    }

    @GetMapping("/comments/{commentId}/likes")
    public long getCommentLikes(@PathVariable Long commentId) {
        return commentService.getCommentLikeCount(commentId);
    }

    @GetMapping("/comments/{commentId}/like/status")
    public boolean isCommentLiked(
            @PathVariable Long commentId,
            @RequestParam Long userId
    ) {
        return commentService.isCommentLiked(userId, commentId);
    }
}