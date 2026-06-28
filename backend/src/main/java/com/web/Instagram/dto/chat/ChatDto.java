package com.web.Instagram.dto.chat;

import java.time.LocalDateTime;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatDto {
    private Long id;
    private Long otherUserId;
    private String username;
    private String fullName;
    private String profilePicture;
    private String lastMessage;
    private String lastMessageSender;
    private LocalDateTime lastMessageAt;
    private LocalDateTime lastSeen;
    private long unreadCount;
    private boolean online;
    private boolean pinned;
    private boolean archived;
    private boolean muted;
    private LocalDateTime muteUntil;
    private String theme;
    private String wallpaper;
    private String nickname;
    private String vanishMode;
    private boolean request;
}
