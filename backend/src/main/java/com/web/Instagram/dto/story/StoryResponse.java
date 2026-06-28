package com.web.Instagram.dto.story;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryResponse {
    private Long id;
    private String mediaUrl;
    private String mediaType;
    private String caption;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private StoryUser user;
    private long likeCount;
    private boolean likedByCurrentUser;
    private long viewCount;
    private Long musicId;
    private String musicTitle;
    private String musicArtist;
    private String musicAudioUrl;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoryUser {
        private Long id;
        private String username;
        private String fullName;
        private String profilePicture;
    }
}
