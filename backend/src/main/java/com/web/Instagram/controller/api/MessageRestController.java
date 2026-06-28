package com.web.Instagram.controller.api;

import com.web.Instagram.dto.chat.MessageDto;
import com.web.Instagram.dto.chat.SendMessageRequest;
import com.web.Instagram.service.MessageService;
import com.web.Instagram.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.web.Instagram.service.CloudinaryService cloudinaryService;

    @GetMapping("/{chatId}")
    public ResponseEntity<Page<MessageDto>> getMessages(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return ResponseEntity.ok(
                messageService.getMessages(chatId, page, size)
        );
    }

    @PostMapping
    public ResponseEntity<MessageDto> sendMessage(
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageDto message = messageService.sendMessage(request);
        messagingTemplate.convertAndSend("/topic/chat/" + request.getChatId(), message);
        return ResponseEntity.ok(message);
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> uploadMessageMedia(@RequestParam MultipartFile media) {
        Map<String, Object> upload = cloudinaryService.uploadFile(media, "instagram/messages");
        String contentType = media.getContentType() != null ? media.getContentType() : "";
        String messageType = contentType.startsWith("video/")
                ? "VIDEO"
                : contentType.startsWith("audio/") ? "AUDIO" : "IMAGE";
        return ResponseEntity.ok(Map.of(
                "mediaUrl", cloudinaryService.getSecureUrl(upload),
                "mediaType", contentType,
                "messageType", messageType
        ));
    }

    @PutMapping("/{chatId}/seen")
    public ResponseEntity<String> markSeen(
            @PathVariable Long chatId
    ) {
        messageService.markSeen(chatId);
        return ResponseEntity.ok("Messages marked as seen");
    }

    @GetMapping("/{chatId}/media")
    public ResponseEntity<Page<MessageDto>> getSharedMedia(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(messageService.getSharedMedia(chatId, page, size));
    }

    @GetMapping("/{chatId}/links")
    public ResponseEntity<Page<MessageDto>> getSharedLinks(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(messageService.getSharedLinks(chatId, page, size));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        messageService.deleteMessage(messageId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageDto> editMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(messageService.editMessage(messageId, body.get("content")));
    }

    @PostMapping("/{messageId}/react")
    public ResponseEntity<Void> reactToMessage(
            Principal principal,
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        String reaction = body.get("reaction");
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        messageService.reactToMessage(messageId, userId, reaction);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{messageId}/react")
    public ResponseEntity<Void> removeReaction(Principal principal, @PathVariable Long messageId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        messageService.removeReaction(messageId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{messageId}/reactions")
    public ResponseEntity<List<com.web.Instagram.entity.MessageReaction>> getReactions(@PathVariable Long messageId) {
        return ResponseEntity.ok(messageService.getReactions(messageId));
    }

    @DeleteMapping("/{messageId}/unsend")
    public ResponseEntity<Void> unsendMessage(
            Principal principal,
            @PathVariable Long messageId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        messageService.unsendMessage(messageId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MessageDto>> searchMessages(
            @RequestParam Long chatId,
            @RequestParam String query,
            Pageable pageable) {
        return ResponseEntity.ok(messageService.searchMessages(chatId, query, pageable));
    }

    @GetMapping("/forwarded")
    public ResponseEntity<Page<MessageDto>> getForwardedMessages(
            @RequestParam Long chatId,
            Pageable pageable) {
        return ResponseEntity.ok(messageService.getForwardedMessages(chatId, pageable));
    }

    @GetMapping("/media")
    public ResponseEntity<Page<MessageDto>> getMediaMessages(
            @RequestParam Long chatId,
            Pageable pageable) {
        return ResponseEntity.ok(messageService.getMediaMessages(chatId, pageable));
    }
}
