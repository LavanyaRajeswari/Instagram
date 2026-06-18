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
    public Comment addComment(@PathVariable Long postId, @RequestParam Long userId, @RequestParam String text) {
        return commentService.addComment(
                userId,
                postId,
                text
        );
    }

    @GetMapping("/{postId}/comments")
    public List<Comment> getComments(@PathVariable Long postId) {
        return commentService.getComments(postId);
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
}