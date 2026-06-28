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

    @PutMapping("/{chatId}/nickname")
    public ResponseEntity<Void> setNickname(@PathVariable Long chatId, @RequestBody Map<String, String> body) {
        chatService.setNickname(chatId, body.get("nickname"));
        return ResponseEntity.ok().build();
    }
}