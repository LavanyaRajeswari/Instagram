package com.web.Instagram.controller.api;

import com.web.Instagram.dto.chat.MessageDto;
import com.web.Instagram.dto.chat.SendMessageRequest;
import com.web.Instagram.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;
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

    @PostMapping("/{messageId}/reaction")
    public ResponseEntity<MessageDto> reactToMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(messageService.reactToMessage(messageId, body.get("emoji")));
    }
}
