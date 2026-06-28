package com.web.Instagram.controller.api;

import com.web.Instagram.entity.NotificationSetting;
import com.web.Instagram.service.SettingsService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settings")
public class SettingsRestController {

    private final SettingsService settingsService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSettings(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(settingsService.getAllSettings(userId));
    }

    @PutMapping("/theme")
    public ResponseEntity<Void> setTheme(
            Principal principal,
            @RequestParam String value) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.setTheme(userId, value);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/sensitive-content")
    public ResponseEntity<Void> setSensitiveContent(
            Principal principal,
            @RequestParam String value) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.setSensitiveContentFilter(userId, value);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reel-downloads")
    public ResponseEntity<Void> setReelDownloads(
            Principal principal,
            @RequestParam boolean value) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.setAllowReelDownloads(userId, value);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/story-replies")
    public ResponseEntity<Void> setStoryReplies(
            Principal principal,
            @RequestParam boolean value) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.setStoryRepliesEnabled(userId, value);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/story-mentions")
    public ResponseEntity<Void> setStoryMentions(
            Principal principal,
            @RequestParam boolean value) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.setStoryMentionsEnabled(userId, value);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/notifications")
    public ResponseEntity<NotificationSetting> getNotificationSettings(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(settingsService.getNotificationSettings(userId));
    }

    @PutMapping("/notifications")
    public ResponseEntity<NotificationSetting> updateNotificationSettings(
            Principal principal,
            @RequestBody Map<String, Boolean> updates) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(settingsService.updateNotificationSettings(userId, updates));
    }

    @GetMapping("/story-hide-from")
    public ResponseEntity<List<Map<String, Object>>> getStoryHideFrom(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(settingsService.getStoryHideFrom(userId));
    }

    @PostMapping("/story-hide-from/{targetUserId}")
    public ResponseEntity<Void> addStoryHideFrom(
            Principal principal,
            @PathVariable Long targetUserId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.addStoryHideFrom(userId, targetUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/story-hide-from/{targetUserId}")
    public ResponseEntity<Void> removeStoryHideFrom(
            Principal principal,
            @PathVariable Long targetUserId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        settingsService.removeStoryHideFrom(userId, targetUserId);
        return ResponseEntity.ok().build();
    }
}
