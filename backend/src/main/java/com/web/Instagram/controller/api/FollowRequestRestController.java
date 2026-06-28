package com.web.Instagram.controller.api;

import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.service.FollowRequestService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/follow-requests")
public class FollowRequestRestController {

    private final FollowRequestService followRequestService;
    private final UserService userService;

    @PostMapping("/{followingId}")
    public ResponseEntity<Void> sendFollowRequest(Principal principal, @PathVariable Long followingId) {
        Long followerId = userService.getCurrentUser(principal.getName()).getId();
        followRequestService.sendFollowRequest(followerId, followingId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<Void> acceptFollowRequest(Principal principal, @PathVariable Long requestId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        followRequestService.acceptFollowRequest(requestId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{requestId}/reject")
    public ResponseEntity<Void> rejectFollowRequest(Principal principal, @PathVariable Long requestId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        followRequestService.rejectFollowRequest(requestId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    public ResponseEntity<List<UserResponse>> getPendingRequests(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(followRequestService.getPendingFollowRequests(userId));
    }

    @GetMapping("/pending/count")
    public ResponseEntity<Long> getPendingRequestsCount(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(followRequestService.getPendingFollowRequestsCount(userId));
    }

    @DeleteMapping("/{followingId}/cancel")
    public ResponseEntity<Void> cancelFollowRequest(Principal principal, @PathVariable Long followingId) {
        Long followerId = userService.getCurrentUser(principal.getName()).getId();
        followRequestService.cancelFollowRequest(followerId, followingId);
        return ResponseEntity.ok().build();
    }
}