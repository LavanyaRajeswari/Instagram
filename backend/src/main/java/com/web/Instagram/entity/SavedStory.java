package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_stories", indexes = {
    @Index(name = "idx_saved_stories_user_id", columnList = "user_id"),
    @Index(name = "idx_saved_stories_story_id", columnList = "story_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "story_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavedStory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @CreationTimestamp
    private LocalDateTime savedAt;
}