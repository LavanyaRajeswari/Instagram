package com.web.Instagram.controller.api;

import com.web.Instagram.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class FollowRestController {

    private final FollowService followService;

    @PostMapping("/{followingId}/follow")
    public String followUser(
            @PathVariable Long followingId,
            @RequestParam Long followerId
    ) {
        followService.followUser(followerId, followingId);
        return "Followed";
    }

    @DeleteMapping("/{followingId}/follow")
    public String unfollowUser(
            @PathVariable Long followingId,
            @RequestParam Long followerId
    ) {
        followService.unfollowUser(followerId, followingId);
        return "Unfollowed";
    }

    @GetMapping("/{followingId}/follow/status")
    public boolean isFollowing(
            @PathVariable Long followingId,
            @RequestParam Long followerId
    ) {
        return followService.isFollowing(followerId, followingId);
    }

    @GetMapping("/{userId}/followers/count")
    public long getFollowersCount(@PathVariable Long userId) {
        return followService.getFollowersCount(userId);
    }

    @GetMapping("/{userId}/following/count")
    public long getFollowingCount(@PathVariable Long userId) {
        return followService.getFollowingCount(userId);
    }
}