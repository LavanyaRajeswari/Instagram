package com.web.Instagram.controller.api;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.service.NotificationService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationRestController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/seen")
    public ResponseEntity<Void> markSeen(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        notificationService.markSeen(id, userId);
        return ResponseEntity.ok().build();
    }

}