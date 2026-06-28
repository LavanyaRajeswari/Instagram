package com.web.Instagram.controller.api;

import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.service.FollowRequestService;
import com.web.Instagram.service.FollowService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class FollowRestController {

    private final FollowService followService;
    private final UserService userService;
    private final FollowRequestService followRequestService;

    @PostMapping("/{followingId}/follow")
    public ResponseEntity<Void> followUser(
            Principal principal,
            @PathVariable Long followingId) {
        Long followerId = userService.getCurrentUser(principal.getName()).getId();
        followService.followUser(followerId, followingId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{followingId}/follow")
    public ResponseEntity<Void> unfollowUser(
            Principal principal,
            @PathVariable Long followingId) {
        Long followerId = userService.getCurrentUser(principal.getName()).getId();
        followService.unfollowUser(followerId, followingId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{followingId}/follow/status")
    public ResponseEntity<Map<String, Object>> isFollowing(
            Principal principal,
            @PathVariable Long followingId) {
        Long followerId = userService.getCurrentUser(principal.getName()).getId();
        boolean following = followService.isFollowing(followerId, followingId);
        boolean requested = followRequestService.hasPendingRequest(followerId, followingId);
        return ResponseEntity.ok(Map.of("following", following, "requested", requested));
    }

    @GetMapping("/{userId}/followers/count")
    public ResponseEntity<Long> getFollowersCount(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowersCount(userId));
    }

    @GetMapping("/{userId}/following/count")
    public ResponseEntity<Long> getFollowingCount(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowingCount(userId));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<Page<UserResponse>> getFollowers(
            Principal principal,
            @PathVariable Long userId,
            @PageableDefault(size = 20) Pageable pageable) {
        String requesterUsername = principal != null ? principal.getName() : null;
        if (!userService.canViewProfile(requesterUsername, userId)) {
            return ResponseEntity.ok(Page.empty());
        }
        return ResponseEntity.ok(followService.getFollowersUsers(userId, pageable));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<Page<UserResponse>> getFollowing(
            Principal principal,
            @PathVariable Long userId,
            @PageableDefault(size = 20) Pageable pageable) {
        String requesterUsername = principal != null ? principal.getName() : null;
        if (!userService.canViewProfile(requesterUsername, userId)) {
            return ResponseEntity.ok(Page.empty());
        }
        return ResponseEntity.ok(followService.getFollowingUsers(userId, pageable));
    }

    @DeleteMapping("/{followerId}/follower")
    public ResponseEntity<Void> removeFollower(
            Principal principal,
            @PathVariable Long followerId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        followService.removeFollower(userId, followerId);
        return ResponseEntity.ok().build();
    }
}