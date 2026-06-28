package com.web.Instagram.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private String text;
    private LocalDateTime createdAt;
    private Long likeCount;
    private boolean likedByCurrentUser;
    private Long userId;
    private String username;
    private CommentUser user;
    private List<CommentResponse> replies;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentUser {
        private Long id;
        private String username;
        private String fullName;
        private String profilePicture;
    }
}
