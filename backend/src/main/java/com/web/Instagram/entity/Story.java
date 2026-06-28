package com.web.Instagram.entity;
import java.io.Serializable;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "stories", indexes = {
    @Index(name = "idx_stories_user_id", columnList = "user_id")
})
public class Story implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mediaUrl;

    private String mediaType;

    private String caption;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    @Column(length = 20)
    private String audience;

    private Long musicId;

    @Column(length = 50)
    private String fontStyle;

    @Builder.Default
    private Boolean showFontStyle = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        expiresAt = createdAt.plusHours(24);
    }
}