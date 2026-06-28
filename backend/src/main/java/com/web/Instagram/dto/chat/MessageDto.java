package com.web.Instagram.dto.chat;

import java.time.LocalDateTime;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {
    private Long id;
    private Long senderId;
    private String content;
    private String messageType;
    private String mediaUrl;
    private String mediaType;
    private Long replyToId;
    private boolean forwarded;
    private Long forwardedFromId;
    private boolean deleted;
    private boolean seen;
    private LocalDateTime createdAt;
}