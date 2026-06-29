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
@Builder
@Table(name = "restricted_users", indexes = {
    @Index(name = "idx_restricted_users_restricter_id", columnList = "restricter_id"),
    @Index(name = "idx_restricted_users_restricted_id", columnList = "restricted_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"restricter_id", "restricted_id"})
})
public class RestrictedUser implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restricter_id", nullable = false)
    private User restricter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restricted_id", nullable = false)
    private User restricted;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
