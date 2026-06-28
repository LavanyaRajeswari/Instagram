package com.web.Instagram.controller.api;

import com.web.Instagram.entity.ChatSetting;
import com.web.Instagram.repository.ChatSettingRepository;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/chats/settings")
@RequiredArgsConstructor
public class ChatSettingRestController {

    private final ChatSettingRepository chatSettingRepository;
    private final UserService userService;

    @GetMapping("/{chatId}")
    public ResponseEntity<ChatSetting> getChatSetting(Principal principal, @PathVariable Long chatId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.ok(new ChatSetting()));
    }

    @PutMapping("/{chatId}/theme")
    public ResponseEntity<Void> setTheme(Principal principal, @PathVariable Long chatId, @RequestParam String theme) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .orElse(new ChatSetting());
        setting.setTheme(theme);
        chatSettingRepository.save(setting);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/wallpaper")
    public ResponseEntity<Void> setWallpaper(Principal principal, @PathVariable Long chatId, @RequestParam String wallpaper) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .orElse(new ChatSetting());
        setting.setWallpaper(wallpaper);
        chatSettingRepository.save(setting);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/nickname")
    public ResponseEntity<Void> setNickname(Principal principal, @PathVariable Long chatId, @RequestParam String nickname) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .orElse(new ChatSetting());
        setting.setNickname(nickname);
        chatSettingRepository.save(setting);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/custom-emojis")
    public ResponseEntity<Void> setCustomEmojis(Principal principal, @PathVariable Long chatId, @RequestParam String customEmojis) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .orElse(new ChatSetting());
        setting.setCustomEmojis(customEmojis);
        chatSettingRepository.save(setting);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/mute-calls")
    public ResponseEntity<Void> setMuteCalls(Principal principal, @PathVariable Long chatId, @RequestParam boolean muteCalls) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .orElse(new ChatSetting());
        setting.setMuteCalls(muteCalls);
        chatSettingRepository.save(setting);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/mute-notifications")
    public ResponseEntity<Void> setMutedNotifications(Principal principal, @PathVariable Long chatId, @RequestParam boolean muted) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(userId, chatId)
            .orElse(new ChatSetting());
        setting.setMutedNotifications(muted);
        chatSettingRepository.save(setting);
        return ResponseEntity.ok().build();
    }
}