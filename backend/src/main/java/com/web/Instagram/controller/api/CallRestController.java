package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Call;
import com.web.Instagram.service.CallService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallRestController {

    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/start/{userId}")
    public ResponseEntity<Map<String, Object>> startCall(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        Call call = callService.initiateCall(userId, body.getOrDefault("callType", "VOICE"));
        Map<String, Object> event = callEvent(call, "CALL_STARTED");
        messagingTemplate.convertAndSend("/queue/call/" + userId, event);
        return ResponseEntity.ok(callResponse(call));
    }

    @PostMapping("/group/start/{groupId}")
    public ResponseEntity<Map<String, Object>> startGroupCall(@PathVariable Long groupId, @RequestBody Map<String, String> body) {
        Call call = callService.initiateGroupCall(groupId, body.getOrDefault("callType", "VOICE"));
        Map<String, Object> event = callEvent(call, "CALL_STARTED");
        event.put("groupCall", true);
        event.put("groupId", groupId);
        event.put("groupName", call.getGroupChat().getName());
        event.put("groupProfilePicture", call.getGroupChat().getProfilePicture());
        call.getGroupChat().getMembers().stream()
            .filter(member -> !member.getId().equals(call.getCaller().getId()))
            .forEach(member -> messagingTemplate.convertAndSend("/queue/call/" + member.getId(), event));
        return ResponseEntity.ok(callResponse(call));
    }

    @PostMapping("/{callId}/answer")
    public ResponseEntity<Void> answerCall(@PathVariable Long callId) {
        Call call = callService.answerCall(callId);
        Long currentUserId = getCurrentUserId();
        Map<String, Object> event = callEvent(call, "CALL_ACCEPTED");
        event.put("participantId", currentUserId);
        event.put("participants", participants(call));
        if (Boolean.TRUE.equals(call.getGroupCall()) && call.getGroupChat() != null) {
            call.getGroupChat().getMembers().stream()
                .filter(member -> !member.getId().equals(currentUserId))
                .forEach(member -> messagingTemplate.convertAndSend("/queue/call/" + member.getId(), event));
        } else {
            messagingTemplate.convertAndSend("/queue/call/" + call.getCaller().getId(), event);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/reject")
    public ResponseEntity<Void> rejectCall(@PathVariable Long callId) {
        Call call = callService.rejectCall(callId);
        Long currentUserId = getCurrentUserId();
        Map<String, Object> event = callEvent(call, "CALL_REJECTED");
        event.put("participantId", currentUserId);
        if (Boolean.TRUE.equals(call.getGroupCall()) && call.getGroupChat() != null) {
            call.getGroupChat().getMembers().stream()
                .filter(member -> !member.getId().equals(currentUserId))
                .forEach(member -> messagingTemplate.convertAndSend("/queue/call/" + member.getId(), event));
        } else {
            messagingTemplate.convertAndSend("/queue/call/" + call.getCaller().getId(), event);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/cancel")
    public ResponseEntity<Void> cancelCall(@PathVariable Long callId) {
        Call call = callService.cancelCall(callId);
        Long currentUserId = getCurrentUserId();
        Map<String, Object> event = Map.of(
            "type", "CALL_CANCELLED",
            "callId", call.getId()
        );
        if (Boolean.TRUE.equals(call.getGroupCall()) && call.getGroupChat() != null) {
            call.getGroupChat().getMembers().stream()
                .filter(member -> !member.getId().equals(currentUserId))
                .forEach(member -> messagingTemplate.convertAndSend("/queue/call/" + member.getId(), event));
        } else {
            messagingTemplate.convertAndSend("/queue/call/" + call.getCallee().getId(), event);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/end")
    public ResponseEntity<Void> endCall(@PathVariable Long callId) {
        Call call = callService.endCall(callId);
        Long currentUserId = getCurrentUserId();
        Long otherUserId = call.getCaller().getId().equals(currentUserId)
            ? call.getCallee().getId()
            : call.getCaller().getId();
        Map<String, Object> event = Map.of(
            "type", "CALL_ENDED",
            "callId", call.getId(),
            "durationSeconds", call.getDurationSeconds() != null ? call.getDurationSeconds() : 0
        );
        if (Boolean.TRUE.equals(call.getGroupCall()) && call.getGroupChat() != null) {
            call.getGroupChat().getMembers().stream()
                .filter(member -> !member.getId().equals(currentUserId))
                .forEach(member -> messagingTemplate.convertAndSend("/queue/call/" + member.getId(), event));
        } else {
            messagingTemplate.convertAndSend("/queue/call/" + otherUserId, event);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/leave")
    public ResponseEntity<Void> leaveCall(@PathVariable Long callId) {
        Long currentUserId = getCurrentUserId();
        callService.removeParticipant(callId, currentUserId);
        Call call = callService.getCall(callId);
        Map<String, Object> event = callEvent(call, "CALL_LEFT");
        event.put("participantId", currentUserId);
        if (Boolean.TRUE.equals(call.getGroupCall()) && call.getGroupChat() != null) {
            call.getGroupChat().getMembers().stream()
                .filter(member -> !member.getId().equals(currentUserId))
                .forEach(member -> messagingTemplate.convertAndSend("/queue/call/" + member.getId(), event));
        } else {
            messagingTemplate.convertAndSend("/queue/call/" + call.getCaller().getId(), event);
        }
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> callEvent(Call call, String type) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("type", type);
        event.put("callId", call.getId());
        event.put("callType", call.getCallType());
        event.put("callerId", call.getCaller().getId());
        event.put("callerUsername", call.getCaller().getUsername());
        event.put("callerProfilePicture", call.getCaller().getProfilePicture());
        event.put("groupCall", Boolean.TRUE.equals(call.getGroupCall()));
        if (call.getGroupChat() != null) {
            event.put("groupId", call.getGroupChat().getId());
            event.put("groupName", call.getGroupChat().getName());
            event.put("groupProfilePicture", call.getGroupChat().getProfilePicture());
            event.put("groupMembers", groupMembers(call));
        }
        event.put("participants", participants(call));
        return event;
    }

    private Map<String, Object> callResponse(Call call) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", call.getId());
        response.put("callId", call.getId());
        response.put("callType", call.getCallType());
        response.put("status", call.getStatus());
        response.put("callerId", call.getCaller().getId());
        response.put("callerUsername", call.getCaller().getUsername());
        response.put("callerProfilePicture", call.getCaller().getProfilePicture());
        response.put("calleeId", call.getCallee().getId());
        response.put("calleeUsername", call.getCallee().getUsername());
        response.put("calleeProfilePicture", call.getCallee().getProfilePicture());
        response.put("groupCall", Boolean.TRUE.equals(call.getGroupCall()));
        response.put("participantCount", callService.getParticipantCount(call.getId()));
        if (call.getGroupChat() != null) {
            response.put("groupId", call.getGroupChat().getId());
            response.put("groupName", call.getGroupChat().getName());
            response.put("groupProfilePicture", call.getGroupChat().getProfilePicture());
            response.put("groupMembers", groupMembers(call));
        }
        response.put("participants", participants(call));
        response.put("createdAt", call.getCreatedAt());
        response.put("startedAt", call.getStartedAt());
        response.put("endedAt", call.getEndedAt());
        response.put("durationSeconds", call.getDurationSeconds() != null ? call.getDurationSeconds() : 0);
        return response;
    }

    private Long getCurrentUserId() {
        String username = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication().getName();
        return callService.getUserIdByUsername(username);
    }

    private List<Map<String, Object>> groupMembers(Call call) {
        if (call.getGroupChat() == null) return List.of();
        return call.getGroupChat().getMembers().stream()
            .map(this::userSummary)
            .toList();
    }

    private List<Map<String, Object>> participants(Call call) {
        return callService.getParticipants(call.getId()).stream()
            .map(this::userSummary)
            .toList();
    }

    private Map<String, Object> userSummary(com.web.Instagram.entity.User user) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", user.getId());
        summary.put("username", user.getUsername());
        summary.put("fullName", user.getFullName());
        summary.put("profilePicture", user.getProfilePicture());
        return summary;
    }

    @GetMapping("/history")
    public ResponseEntity<Page<Map<String, Object>>> getCallHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(callService.getCallHistory(page, size).map(this::callResponse));
    }
}
