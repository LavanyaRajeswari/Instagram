package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_chat_messages")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private GroupChatMessage replyTo;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
