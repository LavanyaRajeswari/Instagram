package com.web.Instagram.dto.user;

import java.io.Serializable;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String bio;
    private String gender;
    private String profilePicture;
    private String website;
    @JsonProperty("isPrivate")
    private boolean isPrivate;
    @JsonProperty("isVerified")
    private boolean isVerified;
    private Long postsCount;
    private Long followersCount;
    private Long followingCount;
    private String pronouns;
    private LocalDateTime lastActiveAt;
    private String accountStatus;
    private boolean commentsDisabled;
    private boolean hideLikeCount;
    private boolean activityStatus;
    private boolean readReceipts;
    private String sensitiveContentFilter;
    private boolean allowReelDownloads;
    private String theme;
    private boolean storyRepliesEnabled;
    private boolean storyMentionsEnabled;
    private LocalDateTime createdAt;
}
