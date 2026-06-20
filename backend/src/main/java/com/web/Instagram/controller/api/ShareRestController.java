package com.web.Instagram.controller.api;

import com.web.Instagram.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class ShareRestController {

    private final ShareService shareService;

    @PostMapping("/{postId}/share")
    public long sharePost(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(defaultValue = "COPY_LINK") String shareType
    ) {
        return shareService.sharePost(userId, postId, receiverId, shareType);
    }

    @GetMapping("/{postId}/shares")
    public long getShareCount(@PathVariable Long postId) {
        return shareService.getShareCount(postId);
    }
}