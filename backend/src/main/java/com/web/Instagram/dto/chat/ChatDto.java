package com.web.Instagram.dto.chat;

import java.time.LocalDateTime;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatDto {
    private Long id;
    private Long otherUserId;
    private String username;
    private String fullName;
    private String profilePicture;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private LocalDateTime lastSeen;
    private long unreadCount;
    private boolean online;
    private boolean muted;
    private LocalDateTime muteUntil;
    private String nickname;
}
