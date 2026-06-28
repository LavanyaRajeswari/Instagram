package com.web.Instagram.dto.note;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class NoteResponse {
    private Long id;
    private String text;
    private String color;
    private String audience;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private long likeCount;
    private long replyCount;
    private boolean likedByCurrentUser;
    private NoteUser user;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NoteUser {
        private Long id;
        private String username;
        private String fullName;
        private String profilePicture;
    }
}