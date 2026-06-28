package com.web.Instagram.controller.api;

import com.web.Instagram.service.ShareService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ShareRestController {

    private final ShareService shareService;
    private final UserService userService;

    @PostMapping("/posts/{postId}/share")
    public ResponseEntity<Long> sharePost(
            Principal principal,
            @PathVariable Long postId,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(defaultValue = "COPY_LINK") String shareType) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(shareService.sharePost(userId, postId, receiverId, shareType));
    }

    @GetMapping("/posts/{postId}/shares")
    public ResponseEntity<Long> getShareCount(@PathVariable Long postId) {
        return ResponseEntity.ok(shareService.getShareCount(postId));
    }

    @PostMapping("/stories/{storyId}/share")
    public ResponseEntity<Long> shareStory(
            Principal principal,
            @PathVariable Long storyId,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(defaultValue = "COPY_LINK") String shareType) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(shareService.shareStory(userId, storyId, receiverId, shareType));
    }

    @GetMapping("/stories/{storyId}/shares")
    public ResponseEntity<Long> getStoryShareCount(@PathVariable Long storyId) {
        return ResponseEntity.ok(shareService.getStoryShareCount(storyId));
    }
}