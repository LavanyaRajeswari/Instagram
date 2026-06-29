package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "calls", indexes = {
    @Index(name = "idx_calls_caller_id", columnList = "caller_id"),
    @Index(name = "idx_calls_callee_id", columnList = "callee_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Call {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "callee_id", nullable = false)
    private User callee;

    @Column(nullable = false, length = 20)
    private String callType;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "MISSED";

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer durationSeconds;

    @Column(name = "is_group_call")
    @Builder.Default
    private Boolean groupCall = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_chat_id")
    private GroupChat groupChat;

    @Builder.Default
    private Boolean recording = false;

    private Long groupId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}