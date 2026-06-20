package com.web.Instagram.controller.api;

import com.web.Instagram.service.FollowService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowRestController {

    private final FollowService followService;
    private final UserService userService;

    @PostMapping("/{userId}")
    public void followUser(
            @PathVariable Long userId
    ) {

        followService.followUser(
                userId,
                userService.getAuthenticatedUser()
        );
    }

    @DeleteMapping("/{userId}")
    public void unfollowUser(
            @PathVariable Long userId
    ) {

        followService.unfollowUser(
                userId,
                userService.getAuthenticatedUser()
        );
    }
}