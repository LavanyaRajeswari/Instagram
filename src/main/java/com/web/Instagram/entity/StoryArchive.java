package com.web.Instagram.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "story_archives")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoryArchive {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String mediaUrl;

    @Column(length = 50)
    private String mediaType;

    @Column(length = 2200)
    private String caption;

    @CreationTimestamp
    private LocalDateTime archivedAt;
}