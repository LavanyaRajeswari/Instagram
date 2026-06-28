package com.web.Instagram.service;

import com.web.Instagram.entity.NotificationSetting;
import com.web.Instagram.entity.StoryHideFrom;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.NotificationSettingRepository;
import com.web.Instagram.repository.StoryHideFromRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserRepository userRepository;
    private final NotificationSettingRepository notificationSettingRepository;
    private final StoryHideFromRepository storyHideFromRepository;

    public Map<String, Object> getAllSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> settings = new HashMap<>();
        settings.put("theme", user.getTheme() != null ? user.getTheme() : "SYSTEM");
        settings.put("sensitiveContentFilter", user.getSensitiveContentFilter() != null ? user.getSensitiveContentFilter() : "STANDARD");
        settings.put("allowReelDownloads", user.getAllowReelDownloads() != null ? user.getAllowReelDownloads() : true);
        settings.put("storyRepliesEnabled", user.getStoryRepliesEnabled() != null ? user.getStoryRepliesEnabled() : true);
        settings.put("storyMentionsEnabled", user.getStoryMentionsEnabled() != null ? user.getStoryMentionsEnabled() : true);
        settings.put("activityStatus", user.getActivityStatus() != null ? user.getActivityStatus() : true);
        settings.put("readReceipts", user.getReadReceipts() != null ? user.getReadReceipts() : true);
        settings.put("hideLikeCount", user.getHideLikeCount() != null ? user.getHideLikeCount() : false);
        settings.put("commentsDisabled", user.getCommentsDisabled() != null ? user.getCommentsDisabled() : false);
        settings.put("isPrivate", user.getIsPrivate() != null ? user.getIsPrivate() : false);

        NotificationSetting ns = notificationSettingRepository.findByUserId(userId).orElse(null);
        if (ns != null) {
            settings.put("pushEnabled", ns.getPushEnabled());
            settings.put("likesEnabled", ns.getLikesEnabled());
            settings.put("commentsEnabled", ns.getCommentsEnabled());
            settings.put("followsEnabled", ns.getFollowsEnabled());
            settings.put("mentionsEnabled", ns.getMentionsEnabled());
            settings.put("messagesEnabled", ns.getMessagesEnabled());
            settings.put("storiesEnabled", ns.getStoriesEnabled());
            settings.put("liveEnabled", ns.getLiveEnabled());
        } else {
            settings.put("pushEnabled", true);
            settings.put("likesEnabled", true);
            settings.put("commentsEnabled", true);
            settings.put("followsEnabled", true);
            settings.put("mentionsEnabled", true);
            settings.put("messagesEnabled", true);
            settings.put("storiesEnabled", true);
            settings.put("liveEnabled", true);
        }

        return settings;
    }

    @Transactional
    public void setTheme(Long userId, String theme) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!List.of("LIGHT", "DARK", "SYSTEM").contains(theme.toUpperCase())) {
            throw new RuntimeException("Invalid theme. Must be LIGHT, DARK, or SYSTEM");
        }
        user.setTheme(theme.toUpperCase());
        userRepository.save(user);
    }

    @Transactional
    public void setSensitiveContentFilter(Long userId, String filter) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!List.of("OFF", "STANDARD", "MORE", "LESS").contains(filter.toUpperCase())) {
            throw new RuntimeException("Invalid filter. Must be OFF, STANDARD, MORE, or LESS");
        }
        user.setSensitiveContentFilter(filter.toUpperCase());
        userRepository.save(user);
    }

    @Transactional
    public void setAllowReelDownloads(Long userId, boolean value) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAllowReelDownloads(value);
        userRepository.save(user);
    }

    @Transactional
    public void setStoryRepliesEnabled(Long userId, boolean value) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStoryRepliesEnabled(value);
        userRepository.save(user);
    }

    @Transactional
    public void setStoryMentionsEnabled(Long userId, boolean value) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStoryMentionsEnabled(value);
        userRepository.save(user);
    }

    public NotificationSetting getNotificationSettings(Long userId) {
        return notificationSettingRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    NotificationSetting ns = new NotificationSetting();
                    ns.setUser(user);
                    return notificationSettingRepository.save(ns);
                });
    }

    @Transactional
    public NotificationSetting updateNotificationSettings(Long userId, Map<String, Boolean> updates) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        NotificationSetting ns = notificationSettingRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationSetting newNs = new NotificationSetting();
                    newNs.setUser(user);
                    return notificationSettingRepository.save(newNs);
                });
        if (updates.containsKey("pushEnabled")) ns.setPushEnabled(updates.get("pushEnabled"));
        if (updates.containsKey("likesEnabled")) ns.setLikesEnabled(updates.get("likesEnabled"));
        if (updates.containsKey("commentsEnabled")) ns.setCommentsEnabled(updates.get("commentsEnabled"));
        if (updates.containsKey("followsEnabled")) ns.setFollowsEnabled(updates.get("followsEnabled"));
        if (updates.containsKey("mentionsEnabled")) ns.setMentionsEnabled(updates.get("mentionsEnabled"));
        if (updates.containsKey("messagesEnabled")) ns.setMessagesEnabled(updates.get("messagesEnabled"));
        if (updates.containsKey("storiesEnabled")) ns.setStoriesEnabled(updates.get("storiesEnabled"));
        if (updates.containsKey("liveEnabled")) ns.setLiveEnabled(updates.get("liveEnabled"));
        return notificationSettingRepository.save(ns);
    }

    public List<Map<String, Object>> getStoryHideFrom(Long userId) {
        return storyHideFromRepository.findByUserId(userId).stream()
                .map(shf -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", shf.getId());
                    m.put("userId", shf.getTargetUser().getId());
                    m.put("username", shf.getTargetUser().getUsername());
                    m.put("fullName", shf.getTargetUser().getFullName());
                    m.put("profilePicture", shf.getTargetUser().getProfilePicture());
                    return m;
                }).toList();
    }

    @Transactional
    public void addStoryHideFrom(Long userId, Long targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new RuntimeException("Cannot hide stories from yourself");
        }
        if (storyHideFromRepository.existsByUserIdAndTargetUserId(userId, targetUserId)) {
            throw new RuntimeException("User already in hide list");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));
        StoryHideFrom shf = StoryHideFrom.builder()
                .user(user)
                .targetUser(target)
                .build();
        storyHideFromRepository.save(shf);
    }

    @Transactional
    public void removeStoryHideFrom(Long userId, Long targetUserId) {
        if (!storyHideFromRepository.existsByUserIdAndTargetUserId(userId, targetUserId)) {
            throw new RuntimeException("User not in hide list");
        }
        storyHideFromRepository.deleteByUserIdAndTargetUserId(userId, targetUserId);
    }
}
