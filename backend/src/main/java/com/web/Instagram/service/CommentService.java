package com.web.Instagram.service;

import com.web.Instagram.dto.comment.CommentResponse;
import com.web.Instagram.entity.Comment;
import com.web.Instagram.entity.CommentLike;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.CommentLikeRepository;
import com.web.Instagram.repository.CommentRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public CommentResponse addComment(Long userId, Long postId, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment cannot be empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        ensureCommentsAllowed(post);

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setPost(post);
        comment.setText(text.trim());

        Comment saved = commentRepository.save(comment);

        try {
            notificationService.createNotification(
                    post.getUser().getId(), userId, "COMMENT", postId, saved.getId(), text
            );
        } catch (Exception e) {
            java.util.logging.Logger.getLogger(getClass().getName()).warning("Failed to create notification: " + e.getMessage());
        }

        return toResponse(saved, userId, false);
    }

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public CommentResponse addReply(Long userId, Long postId, Long parentCommentId, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply cannot be empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        ensureCommentsAllowed(post);

        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent comment not found"));

        if (!parentComment.getPost().getId().equals(postId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment does not belong to this post");
        }

        Comment reply = new Comment();
        reply.setUser(user);
        reply.setPost(post);
        reply.setParentComment(parentComment);
        reply.setText(text.trim());

        Comment saved = commentRepository.save(reply);

        try {
            notificationService.createNotification(
                    parentComment.getUser().getId(), userId, "COMMENT_REPLY", postId, saved.getId(), text
            );
        } catch (Exception e) {
            java.util.logging.Logger.getLogger(getClass().getName()).warning("Failed to create notification: " + e.getMessage());
        }

        return toResponse(saved, userId, false);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId, Long currentUserId) {
        List<Comment> comments = commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId);
        return batchToResponse(comments, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getReplies(Long parentCommentId, Long currentUserId) {
        List<Comment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
        return batchToResponse(replies, currentUserId);
    }

    private List<CommentResponse> batchToResponse(List<Comment> comments, Long currentUserId) {
        if (comments.isEmpty()) return List.of();
        List<Long> ids = comments.stream().map(Comment::getId).toList();

        Map<Long, Long> likeCounts = commentLikeRepository.countByCommentIdIn(ids).stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));

        return comments.stream().map(comment -> {
            User user = comment.getUser();
            long likeCount = likeCounts.getOrDefault(comment.getId(), 0L);
            boolean likedByCurrentUser = currentUserId != null &&
                    commentLikeRepository.existsByUserIdAndCommentId(currentUserId, comment.getId());

            CommentResponse.CommentUser commentUser = CommentResponse.CommentUser.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .profilePicture(user.getProfilePicture())
                    .build();

            List<CommentResponse> replies = null;
            if (comment.getReplies() != null) {
                replies = comment.getReplies().stream()
                        .map(reply -> toResponse(reply, currentUserId, true))
                        .toList();
            }

            return CommentResponse.builder()
                    .id(comment.getId())
                    .text(comment.getText())
                    .createdAt(comment.getCreatedAt())
                    .likeCount(likeCount)
                    .likedByCurrentUser(likedByCurrentUser)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .user(commentUser)
                    .replies(replies)
                    .build();
        }).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public void deleteComment(Long postId, Long commentId, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is required");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (postId != null && !comment.getPost().getId().equals(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found for this post");
        }

        Long commentOwnerId = comment.getUser().getId();
        Long postOwnerId = comment.getPost().getUser().getId();

        if (!userId.equals(commentOwnerId) && !userId.equals(postOwnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to delete this comment");
        }

        deleteCommentLikes(comment);
        commentRepository.delete(comment);
    }

    public long getCommentCount(Long postId) {
        return commentRepository.countByPostId(postId);
    }

    @Transactional
    public void likeComment(Long userId, Long commentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (commentLikeRepository.existsByUserIdAndCommentId(userId, commentId)) return;

        CommentLike like = new CommentLike();
        like.setUser(user);
        like.setComment(comment);
        try {
            commentLikeRepository.saveAndFlush(like);
        } catch (DataIntegrityViolationException ignored) {
        }
    }

    @Transactional
    public void unlikeComment(Long userId, Long commentId) {
        commentLikeRepository.deleteByUserIdAndCommentId(userId, commentId);
    }

    public long getCommentLikeCount(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        return commentLikeRepository.countByCommentId(commentId);
    }

    public boolean isCommentLiked(Long userId, Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        return commentLikeRepository.existsByUserIdAndCommentId(userId, commentId);
    }

    private CommentResponse toResponse(Comment comment, Long currentUserId, boolean includeReplies) {
        long likeCount = commentLikeRepository.countByCommentId(comment.getId());
        boolean likedByCurrentUser = currentUserId != null && commentLikeRepository.existsByUserIdAndCommentId(currentUserId, comment.getId());

        User user = comment.getUser();
        CommentResponse.CommentUser commentUser = CommentResponse.CommentUser.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .build();

        List<CommentResponse> replies = null;
        if (includeReplies && comment.getReplies() != null) {
            replies = comment.getReplies().stream()
                    .map(reply -> toResponse(reply, currentUserId, true))
                    .toList();
        }

        return CommentResponse.builder()
                .id(comment.getId())
                .text(comment.getText())
                .createdAt(comment.getCreatedAt())
                .likeCount(likeCount)
                .likedByCurrentUser(likedByCurrentUser)
                .userId(user.getId())
                .username(user.getUsername())
                .user(commentUser)
                .replies(replies)
                .build();
    }

    private void deleteCommentLikes(Comment comment) {
        List<Long> allIds = new java.util.ArrayList<>();
        java.util.ArrayDeque<Comment> stack = new java.util.ArrayDeque<>();
        stack.push(comment);
        while (!stack.isEmpty()) {
            Comment c = stack.pop();
            allIds.add(c.getId());
            if (c.getReplies() != null) {
                c.getReplies().forEach(stack::push);
            }
        }
        commentLikeRepository.deleteByCommentIds(allIds);
    }

    private void ensureCommentsAllowed(Post post) {
        if (Boolean.TRUE.equals(post.getCommentsDisabled()) ||
                Boolean.TRUE.equals(post.getUser().getCommentsDisabled())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Comments are disabled for this post");
        }
    }
}
