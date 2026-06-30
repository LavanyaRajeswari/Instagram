package com.web.Instagram.entity;
import java.io.Serializable;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "chats", indexes = {
    @Index(name = "idx_chats_user_one_id", columnList = "user_one_id"),
    @Index(name = "idx_chats_user_two_id", columnList = "user_two_id"),
    @Index(name = "idx_chats_last_message_at", columnList = "lastMessageAt")
})
public class Chat implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_one_id")
    private User userOne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_two_id")
    private User userTwo;

    private String lastMessage;

    private LocalDateTime lastMessageAt;

    private boolean muted = false;

    private LocalDateTime muteUntil;

    @CreationTimestamp
    private LocalDateTime createdAt;

}
