package com.web.Instagram.controller.api;

import com.web.Instagram.entity.BlockedUser;
import com.web.Instagram.service.BlockedUserService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class BlockedUserRestController {

    private final BlockedUserService blockedUserService;
    private final UserService userService;

    @PostMapping("/{blockedId}/block")
    public ResponseEntity<Void> blockUser(Principal principal, @PathVariable Long blockedId) {
        Long blockerId = userService.getCurrentUser(principal.getName()).getId();
        blockedUserService.blockUser(blockerId, blockedId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{blockedId}/block")
    public ResponseEntity<Void> unblockUser(Principal principal, @PathVariable Long blockedId) {
        Long blockerId = userService.getCurrentUser(principal.getName()).getId();
        blockedUserService.unblockUser(blockerId, blockedId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{blockedId}/block/status")
    public ResponseEntity<Boolean> isBlocked(Principal principal, @PathVariable Long blockedId) {
        Long blockerId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(blockedUserService.isBlocked(blockerId, blockedId));
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<BlockedUser>> getBlockedUsers(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(blockedUserService.getBlockedUsers(userId));
    }
}