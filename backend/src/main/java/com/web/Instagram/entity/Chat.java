package com.web.Instagram.entity;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "chats", indexes = {
    @Index(name = "idx_chats_user_one_last_message", columnList = "user_one_id, last_message_at"),
    @Index(name = "idx_chats_user_two_last_message", columnList = "user_two_id, last_message_at"),
    @Index(name = "idx_chats_user_pair", columnList = "user_one_id, user_two_id"),
    @Index(name = "idx_chats_user_pair_reverse", columnList = "user_two_id, user_one_id")
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
