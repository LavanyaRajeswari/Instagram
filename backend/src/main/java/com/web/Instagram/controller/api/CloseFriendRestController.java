package com.web.Instagram.controller.api;

import com.web.Instagram.dto.closeFriend.CloseFriendResponse;
import com.web.Instagram.service.CloseFriendService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/close-friends")
@RequiredArgsConstructor
public class CloseFriendRestController {

    private final CloseFriendService closeFriendService;
    private final UserService userService;

    @PostMapping("/{friendId}")
    public ResponseEntity<Void> addCloseFriend(
            Principal principal,
            @PathVariable Long friendId) {

        Long ownerId = userService
                .getCurrentUser(principal.getName())
                .getId();

        closeFriendService.addCloseFriend(ownerId, friendId);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> removeCloseFriend(
            Principal principal,
            @PathVariable Long friendId) {

        Long ownerId = userService
                .getCurrentUser(principal.getName())
                .getId();

        closeFriendService.removeCloseFriend(ownerId, friendId);

        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<CloseFriendResponse>> getCloseFriends(
            Principal principal) {

        Long ownerId = userService.getCurrentUser(principal.getName()).getId();
        
        return ResponseEntity.ok(closeFriendService.getCloseFriends(ownerId));
    }

    @GetMapping("/{friendId}/status")
    public ResponseEntity<Boolean> isCloseFriend(
            Principal principal,
            @PathVariable Long friendId) {

        Long ownerId = userService.getCurrentUser(principal.getName()).getId();

        return ResponseEntity.ok(closeFriendService.isCloseFriend(ownerId, friendId));
    }
}