package com.web.Instagram.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_chat_messages", indexes = {
    @Index(name = "idx_group_chat_messages_group_created_at", columnList = "group_chat_id, created_at"),
    @Index(name = "idx_group_chat_messages_unread", columnList = "group_chat_id, deleted, created_at, sender_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GroupChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_chat_id", nullable = false)
    private GroupChat groupChat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String mediaUrl;

    @Column(length = 50)
    private String mediaType;

    @Column(length = 50)
    private String messageType;

    @Column(nullable = false)
    @Builder.Default
    private Boolean seen = false;

    @Builder.Default
    private Boolean deleted = false;

    @Column(length = 1000)
    private String reactions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private GroupChatMessage replyTo;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
