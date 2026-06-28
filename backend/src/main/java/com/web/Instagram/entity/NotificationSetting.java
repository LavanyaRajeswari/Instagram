package com.web.Instagram.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_settings", uniqueConstraints = {
    @UniqueConstraint(columnNames = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    private Boolean pushEnabled = true;

    @Builder.Default
    private Boolean likesEnabled = true;

    @Builder.Default
    private Boolean commentsEnabled = true;

    @Builder.Default
    private Boolean followsEnabled = true;

    @Builder.Default
    private Boolean mentionsEnabled = true;

    @Builder.Default
    private Boolean messagesEnabled = true;

    @Builder.Default
    private Boolean storiesEnabled = true;

    @Builder.Default
    private Boolean liveEnabled = true;
}
