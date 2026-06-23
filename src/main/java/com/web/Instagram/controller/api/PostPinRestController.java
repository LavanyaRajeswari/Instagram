package com.web.Instagram.controller.api;

import com.web.Instagram.service.PostPinService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostPinRestController {

    private final PostPinService postPinService;
    private final UserService userService;

    @PostMapping("/{postId}/pin")
    public ResponseEntity<Void> pinPost(Principal principal, @PathVariable Long postId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postPinService.pinPost(userId, postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}/pin")
    public ResponseEntity<Void> unpinPost(Principal principal, @PathVariable Long postId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        postPinService.unpinPost(userId, postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}/pin/status")
    public ResponseEntity<Map<String, Boolean>> isPinned(Principal principal, @PathVariable Long postId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(Map.of("pinned", postPinService.isPinned(userId, postId)));
    }
}