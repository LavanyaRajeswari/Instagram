package com.web.Instagram.controller.api;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.service.ActivityService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settings/activity")
public class ActivityRestController {

    private final ActivityService activityService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getActivity(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(activityService.getRecentActivity(userId));
    }
}
