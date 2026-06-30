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
@Table(
        name = "comment_likes",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "comment_id"})
        },
        indexes = {
                @Index(name = "idx_comment_likes_comment_id", columnList = "comment_id"),
                @Index(name = "idx_comment_likes_user_id", columnList = "user_id")
        }
)
public class CommentLike implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
