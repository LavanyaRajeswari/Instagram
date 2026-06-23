package com.web.Instagram.dto.feed;

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
public class FeedPostDto {
    private Long postId;
    private String caption;
    private LocalDateTime createdAt;
    private Long userId;
    private String username;
    private String fullName;
    private String profilePicture;
    private List<String> mediaUrls;
    private long likeCount;
    private long commentCount;
    private boolean isLiked;
    private boolean isSaved;

    @Builder.Default
    private double score = 0.0;

    @Builder.Default
    private String source = "FOLLOWED";
}
