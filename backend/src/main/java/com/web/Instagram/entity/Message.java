package com.web.Instagram.entity;
import java.io.Serializable;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "messages", indexes = {
    @Index(name = "idx_messages_chat_id", columnList = "chat_id"),
    @Index(name = "idx_messages_sender_id", columnList = "sender_id")
})
public class Message implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String messageType;

    @Column(length = 500)
    private String mediaUrl;

    @Column(length = 50)
    private String mediaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    private boolean forwarded = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forwarded_from_id")
    private User forwardedFrom;

    private boolean deleted = false;

    private boolean seen;

    @CreationTimestamp
    private LocalDateTime createdAt;
}