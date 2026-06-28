package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "story_archives", indexes = {
    @Index(name = "idx_story_archives_user_id", columnList = "user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoryArchive {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String mediaUrl;

    private String mediaType;

    private String caption;

    private LocalDateTime archivedAt;

    @PrePersist
    public void onCreate() {
        if (archivedAt == null) {
            archivedAt = LocalDateTime.now();
        }
    }
}
