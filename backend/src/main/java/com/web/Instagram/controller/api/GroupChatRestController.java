package com.web.Instagram.controller.api;

import com.web.Instagram.dto.chat.GroupMessageDto;
import com.web.Instagram.entity.GroupChat;
import com.web.Instagram.entity.GroupChatMessageReaction;
import com.web.Instagram.entity.User;
import com.web.Instagram.service.GroupChatService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupChatRestController {

    private final GroupChatService groupChatService;
    private final UserService userService;

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
        return ResponseEntity.ok(groupChatService.sendMessage(groupId, content, messageType, mediaUrl, mediaType, replyToId));
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

    @PutMapping("/{groupId}/nickname")
    public ResponseEntity<Void> setNickname(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        groupChatService.setGroupNickname(groupId, body.get("nickname"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{groupId}/theme")
    public ResponseEntity<Void> setTheme(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        groupChatService.setGroupTheme(groupId, body.get("theme"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/admin/{userId}")
    public ResponseEntity<Void> promoteAdmin(@PathVariable Long groupId, @PathVariable Long userId) {
        groupChatService.promoteToAdmin(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/admin/{userId}")
    public ResponseEntity<Void> demoteAdmin(@PathVariable Long groupId, @PathVariable Long userId) {
        groupChatService.demoteAdmin(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/admins")
    public ResponseEntity<List<User>> getAdmins(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupChatService.getAdmins(groupId));
    }

    @PutMapping("/{groupId}/description")
    public ResponseEntity<Void> updateDescription(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        groupChatService.updateGroupDescription(groupId, body.get("description"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/mute")
    public ResponseEntity<Void> muteGroup(Principal principal, @PathVariable Long groupId, @RequestParam boolean muted) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        groupChatService.muteGroup(groupId, userId, muted);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/messages/{messageId}/react")
    public ResponseEntity<GroupChatMessageReaction> reactToMessage(
            Principal principal, @PathVariable Long messageId, @RequestParam String reaction) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(groupChatService.reactToGroupMessage(messageId, userId, reaction));
    }

    @GetMapping("/{groupId}/messages/{messageId}/reactions")
    public ResponseEntity<List<GroupChatMessageReaction>> getMessageReactions(@PathVariable Long messageId) {
        return ResponseEntity.ok(groupChatService.getGroupMessageReactions(messageId));
    }

    @DeleteMapping("/{groupId}/messages/{messageId}/react")
    public ResponseEntity<Void> removeReaction(Principal principal, @PathVariable Long messageId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        groupChatService.removeGroupMessageReaction(messageId, userId);
        return ResponseEntity.ok().build();
    }
}
