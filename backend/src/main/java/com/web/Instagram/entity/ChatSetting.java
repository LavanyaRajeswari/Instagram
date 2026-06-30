package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_settings", indexes = {
    @Index(name = "idx_chat_settings_user_id", columnList = "user_id"),
    @Index(name = "idx_chat_settings_chat_id", columnList = "chat_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "chat_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChatSetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    private Chat chat;

    @Column(length = 50)
    private String nickname;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
