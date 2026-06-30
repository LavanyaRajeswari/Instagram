package com.web.Instagram.dto.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String caption;
    private LocalDateTime createdAt;
    private Long likeCount;
    private Long commentCount;
    private Long saveCount;
    private Long shareCount;
    private Long repostCount;
    private Long originalPostId;
    private String visibility;
    private boolean hideLikeCount;
    private boolean commentsDisabled;
    private Long musicId;
    private String musicTitle;
    private String musicArtist;
    private String musicAudioUrl;
    private boolean likedByCurrentUser;
    private boolean savedByCurrentUser;
    private boolean followingOwner;
    private PostUser user;
    private PostUser originalPostUser;
    private List<PostMedia> media;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostUser implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long id;
        private String username;
        private String fullName;
        private String profilePicture;
        private LocalDateTime createdAt;
        private boolean commentsDisabled;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostMedia implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long id;
        private String mediaUrl;
        private String mediaType;
        private int sortOrder;
    }
}
