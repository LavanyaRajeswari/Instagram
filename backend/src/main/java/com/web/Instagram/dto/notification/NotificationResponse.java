package com.web.Instagram.dto.notification;

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
public class NotificationResponse {
    private Long id;
    private String type;
    private Long actorId;
    private String actorUsername;
    private String actorProfilePicture;
    private Long postId;
    private Long commentId;
    private Long followRequestId;
    private String commentText;
    private boolean seen;
    private LocalDateTime createdAt;
}
