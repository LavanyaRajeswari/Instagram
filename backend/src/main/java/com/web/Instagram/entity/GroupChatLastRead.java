package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_chat_last_reads",
    uniqueConstraints = @UniqueConstraint(columnNames = {"group_chat_id", "user_id"}),
    indexes = @Index(name = "idx_gclr_group_user", columnList = "group_chat_id, user_id")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GroupChatLastRead {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_chat_id", nullable = false)
    private GroupChat groupChat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastReadAt;
}
