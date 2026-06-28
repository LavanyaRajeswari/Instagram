package com.web.Instagram.entity;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(nullable = false, length = 100)
    private String fullName;

    @JsonIgnore
    @Column(unique = true)
    private String email;

    @JsonIgnore
    @Column(unique = true)
    private String mobileNumber;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    private LocalDate birthDate;

    @Column(length = 150)
    private String bio;

    @Column(length = 50)
    private String gender;

    @Column(length = 500)
    private String profilePicture;

    @Column(length = 200)
    private String website;

    private Boolean isPrivate = false;

    private Boolean isVerified = false;

    @Column(length = 50)
    private String pronouns;

    @JsonIgnore
    @OneToMany(mappedBy = "following")
    private List<Follow> followers = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "follower")
    private List<Follow> following = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<Mute> mutes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private Set<NotificationSetting> notificationSettings;

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<StoryHideFrom> storyHideFromList = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_user_id")
    @JsonIgnore
    private User parentUser;

    @OneToMany(mappedBy = "parentUser")
    @JsonIgnore
    private List<User> childAccounts = new ArrayList<>();

    @Column(length = 20)
    private String accountStatus;

    private LocalDateTime lastActiveAt;

    private boolean online = false;

    private Boolean hideLikeCount = false;

    private Boolean commentsDisabled = false;

    private Boolean activityStatus = true;

    private Boolean readReceipts = true;

    @Column(length = 20)
    private String sensitiveContentFilter = "STANDARD";

    private Boolean allowReelDownloads = true;

    @Column(length = 10)
    private String theme = "SYSTEM";

    private Boolean storyRepliesEnabled = true;

    private Boolean storyMentionsEnabled = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
