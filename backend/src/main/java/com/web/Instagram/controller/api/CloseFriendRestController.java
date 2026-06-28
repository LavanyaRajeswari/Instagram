package com.web.Instagram.controller.api;

import com.web.Instagram.entity.CloseFriend;
import com.web.Instagram.service.CloseFriendService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/close-friends")
public class CloseFriendRestController {

    private final CloseFriendService closeFriendService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<CloseFriend>> getCloseFriends(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(closeFriendService.getCloseFriends(userId));
    }

    @PostMapping
    public ResponseEntity<Void> addCloseFriend(Principal principal, @RequestBody Map<String, Long> body) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        closeFriendService.addCloseFriend(userId, body.get("friendId"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> removeCloseFriend(Principal principal, @PathVariable Long friendId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        closeFriendService.removeCloseFriend(userId, friendId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{friendId}/status")
    public ResponseEntity<Boolean> isCloseFriend(Principal principal, @PathVariable Long friendId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(closeFriendService.isCloseFriend(userId, friendId));
    }
}