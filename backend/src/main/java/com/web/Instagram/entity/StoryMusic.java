package com.web.Instagram.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "story_music", indexes = {
    @Index(name = "idx_story_music_usage_count", columnList = "usage_count")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoryMusic {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String artist;

    @Column(nullable = false, length = 500)
    private String audioUrl;

    @Column(length = 200)
    private String coverArtUrl;

    @Column(nullable = false)
    private Long durationMs;

    @Column(length = 100)
    private String genre;

    @Builder.Default
    private Long usageCount = 0L;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
