package com.web.Instagram.service;

import com.web.Instagram.dto.comment.CommentResponse;
import com.web.Instagram.entity.Comment;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.CommentLikeRepository;
import com.web.Instagram.repository.CommentRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private CommentLikeRepository commentLikeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PostActivityPublisher postActivityPublisher;

    @InjectMocks
    private CommentService commentService;

    @Test
    void addCommentReturnsSavedCommentWhenCommentsAreAllowed() {
        User commenter = user(1L, "sai", false);
        User postOwner = user(2L, "sahithi", false);
        Post post = post(13L, postOwner, false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(commenter));
        when(postRepository.findById(13L)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId(99L);
            return comment;
        });

        CommentResponse response = commentService.addComment(1L, 13L, " hi ");

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getText()).isEqualTo("hi");
        assertThat(response.getUser().getUsername()).isEqualTo("sai");
        verify(notificationService).createNotification(2L, 1L, "COMMENT", 13L, 99L, " hi ");
    }

    @Test
    void addCommentRejectsPostsWhoseOwnerDisabledComments() {
        User commenter = user(1L, "sai", false);
        User postOwner = user(2L, "sahithi", true);
        Post post = post(13L, postOwner, false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(commenter));
        when(postRepository.findById(13L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> commentService.addComment(1L, 13L, "hi"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Comments are disabled");
    }

    @Test
    void addCommentRejectsPostsWithCommentsDisabled() {
        User commenter = user(1L, "sai", false);
        User postOwner = user(2L, "sahithi", false);
        Post post = post(13L, postOwner, true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(commenter));
        when(postRepository.findById(13L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> commentService.addComment(1L, 13L, "hi"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Comments are disabled");
    }

    private static User user(Long id, String username, boolean commentsDisabled) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setFullName(username);
        user.setCommentsDisabled(commentsDisabled);
        return user;
    }

    private static Post post(Long id, User owner, boolean commentsDisabled) {
        Post post = new Post();
        post.setId(id);
        post.setUser(owner);
        post.setCommentsDisabled(commentsDisabled);
        return post;
    }
}
