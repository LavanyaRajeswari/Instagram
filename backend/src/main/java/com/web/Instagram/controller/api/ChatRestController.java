package com.web.Instagram.controller.api;

import com.web.Instagram.dto.chat.ChatDto;
import com.web.Instagram.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

    @PostMapping("/start/{userId}")
    public ResponseEntity<ChatDto> startChat(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                chatService.startChat(userId)
        );
    }

    @GetMapping
    public ResponseEntity<List<ChatDto>> getChats() {
        return ResponseEntity.ok(
                chatService.getChats()
        );
    }

    @GetMapping("/archived")
    public ResponseEntity<List<ChatDto>> getArchivedChats() {
        return ResponseEntity.ok(chatService.getArchivedChats());
    }

    @PutMapping("/{chatId}/pin")
    public ResponseEntity<Void> togglePin(@PathVariable Long chatId) {
        chatService.togglePinChat(chatId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/archive")
    public ResponseEntity<Void> toggleArchive(@PathVariable Long chatId) {
        chatService.toggleArchiveChat(chatId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long chatId) {
        chatService.deleteChat(chatId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/mute")
    public ResponseEntity<Void> muteChat(@PathVariable Long chatId, @RequestBody Map<String, String> body) {
        LocalDateTime muteUntil = body.get("muteUntil") != null ? LocalDateTime.parse(body.get("muteUntil")) : null;
        chatService.muteChat(chatId, muteUntil);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{chatId}/mute")
    public ResponseEntity<Void> unmuteChat(@PathVariable Long chatId) {
        chatService.unmuteChat(chatId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/vanish-mode")
    public ResponseEntity<Void> setVanishMode(@PathVariable Long chatId, @RequestBody Map<String, String> body) {
        chatService.setVanishMode(chatId, body.get("mode"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/theme")
    public ResponseEntity<Void> setTheme(@PathVariable Long chatId, @RequestBody Map<String, String> body) {
        chatService.setChatTheme(chatId, body.get("theme"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/wallpaper")
    public ResponseEntity<Void> setWallpaper(@PathVariable Long chatId, @RequestBody Map<String, String> body) {
        chatService.setChatWallpaper(chatId, body.get("wallpaper"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{chatId}/nickname")
    public ResponseEntity<Void> setNickname(@PathVariable Long chatId, @RequestBody Map<String, String> body) {
        chatService.setNickname(chatId, body.get("nickname"));
        return ResponseEntity.ok().build();
    }
}