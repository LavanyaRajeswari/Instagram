package com.web.Instagram.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMessageDto {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderProfilePicture;
    private String content;
    private String messageType;
    private String mediaUrl;
    private String mediaType;
    private Long replyToId;
    private Boolean seen;
    private Boolean deleted;
    private LocalDateTime createdAt;
}
