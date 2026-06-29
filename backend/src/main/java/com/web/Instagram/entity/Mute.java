package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "mutes", indexes = {
    @Index(name = "idx_mutes_user_id", columnList = "user_id"),
    @Index(name = "idx_mutes_muted_user_id", columnList = "muted_user_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "muted_user_id", "mute_type"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mute {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muted_user_id", nullable = false)
    private User mutedUser;

    @Column(nullable = false, length = 20)
    private String muteType;

    @CreationTimestamp
    private LocalDateTime createdAt;
}