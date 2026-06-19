package com.web.Instagram.service;

import com.web.Instagram.entity.Comment;
import com.web.Instagram.entity.CommentLike;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.CommentLikeRepository;
import com.web.Instagram.repository.CommentRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Transactional
    public Comment addComment(Long userId, Long postId, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new RuntimeException("Comment cannot be empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setPost(post);
        comment.setText(text.trim());

        return hydrateComment(commentRepository.save(comment), userId);
    }

    @Transactional
    public Comment addReply(Long userId, Long postId, Long parentCommentId, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new RuntimeException("Reply cannot be empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));

        if (!parentComment.getPost().getId().equals(postId)) {
            throw new RuntimeException("Parent comment does not belong to this post");
        }

        Comment reply = new Comment();
        reply.setUser(user);
        reply.setPost(post);
        reply.setParentComment(parentComment);
        reply.setText(text.trim());

        return hydrateComment(commentRepository.save(reply), userId);
    }

    @Transactional(readOnly = true)
    public List<Comment> getComments(Long postId, Long currentUserId) {
        List<Comment> comments =
                commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId);

        comments.forEach(comment -> hydrateCommentTree(comment, currentUserId));

        return comments;
    }

    @Transactional(readOnly = true)
    public List<Comment> getReplies(Long parentCommentId, Long currentUserId) {
        List<Comment> replies =
                commentRepository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);

        replies.forEach(reply -> hydrateCommentTree(reply, currentUserId));

        return replies;
    }

    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        commentRepository.delete(comment);
    }

    public long getCommentCount(Long postId) {
        return commentRepository.countByPostId(postId);
    }

    @Transactional
    public void likeComment(Long userId, Long commentId) {
        if (commentLikeRepository.existsByUserIdAndCommentId(userId, commentId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        CommentLike like = new CommentLike();
        like.setUser(user);
        like.setComment(comment);

        commentLikeRepository.save(like);
    }

    @Transactional
    public void unlikeComment(Long userId, Long commentId) {
        commentLikeRepository.deleteByUserIdAndCommentId(userId, commentId);
    }

    public long getCommentLikeCount(Long commentId) {
        return commentLikeRepository.countByCommentId(commentId);
    }

    public boolean isCommentLiked(Long userId, Long commentId) {
        return commentLikeRepository.existsByUserIdAndCommentId(userId, commentId);
    }

    private Comment hydrateComment(Comment comment, Long currentUserId) {
        comment.setLikeCount(commentLikeRepository.countByCommentId(comment.getId()));

        if (currentUserId != null) {
            comment.setLikedByCurrentUser(
                    commentLikeRepository.existsByUserIdAndCommentId(
                            currentUserId,
                            comment.getId()
                    )
            );
        }

        return comment;
    }

    private void hydrateCommentTree(Comment comment, Long currentUserId) {
        hydrateComment(comment, currentUserId);

        if (comment.getReplies() != null) {
            comment.getReplies().forEach(reply -> hydrateCommentTree(reply, currentUserId));
        }
    }
}