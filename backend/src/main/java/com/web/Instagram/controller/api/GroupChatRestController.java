package com.web.Instagram.controller.api;

import com.web.Instagram.dto.chat.GroupMessageDto;
import com.web.Instagram.entity.GroupChat;
import com.web.Instagram.service.GroupChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupChatRestController {

    private final GroupChatService groupChatService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<GroupChat> createGroup(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        @SuppressWarnings("unchecked")
        List<Long> memberIds = body.get("memberIds") != null
                ? ((List<Number>) body.get("memberIds")).stream().map(Number::longValue).toList()
                : List.of();
        String profilePicture = (String) body.get("profilePicture");
        return ResponseEntity.ok(groupChatService.createGroup(name, description, memberIds, profilePicture));
    }

    @GetMapping
    public ResponseEntity<List<GroupChat>> getUserGroups() {
        return ResponseEntity.ok(groupChatService.getUserGroups());
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupChat> getGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupChatService.getGroup(groupId));
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> addMember(@PathVariable Long groupId, @PathVariable Long userId) {
        groupChatService.addMember(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long groupId, @PathVariable Long userId) {
        groupChatService.removeMember(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(@PathVariable Long groupId) {
        groupChatService.leaveGroup(groupId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<GroupMessageDto> sendMessage(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        String content = (String) body.get("content");
        String messageType = (String) body.get("messageType");
        String mediaUrl = (String) body.get("mediaUrl");
        String mediaType = (String) body.get("mediaType");
        Long replyToId = body.get("replyToId") != null ? ((Number) body.get("replyToId")).longValue() : null;
        GroupMessageDto msg = groupChatService.sendMessage(groupId, content, messageType, mediaUrl, mediaType, replyToId);
        messagingTemplate.convertAndSend("/topic/group/" + groupId, msg);
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/{groupId}/seen")
    public ResponseEntity<Void> markSeen(@PathVariable Long groupId) {
        groupChatService.markGroupRead(groupId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<Page<GroupMessageDto>> getMessages(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(groupChatService.getMessages(groupId, page, size));
    }

    @PutMapping("/{groupId}/messages/{messageId}")
    public ResponseEntity<GroupMessageDto> editMessage(
            @PathVariable Long groupId,
            @PathVariable Long messageId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(groupChatService.editMessage(groupId, messageId, (String) body.get("content")));
    }

    @DeleteMapping("/{groupId}/messages/{messageId}")
    public ResponseEntity<GroupMessageDto> deleteMessage(@PathVariable Long groupId, @PathVariable Long messageId) {
        return ResponseEntity.ok(groupChatService.deleteMessage(groupId, messageId));
    }

    @PostMapping("/{groupId}/messages/{messageId}/reaction")
    public ResponseEntity<GroupMessageDto> reactToMessage(
            @PathVariable Long groupId,
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(groupChatService.reactToMessage(groupId, messageId, body.get("emoji")));
    }

}
