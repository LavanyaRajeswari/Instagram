package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Media;
import com.web.Instagram.service.MediaService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaRestController {

    private final MediaService mediaService;
    private final UserService userService;

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Media>> getPostMedia(@PathVariable Long postId) {
        return ResponseEntity.ok(mediaService.getPostMedia(postId));
    }

    @GetMapping("/{mediaId}")
    public ResponseEntity<Media> getMedia(@PathVariable Long mediaId) {
        return ResponseEntity.ok(mediaService.getMedia(mediaId));
    }

    @PutMapping("/{mediaId}/sort-order")
    public ResponseEntity<Media> updateSortOrder(Principal principal,
                                                  @PathVariable Long mediaId,
                                                  @RequestParam int sortOrder) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(mediaService.updateSortOrder(mediaId, sortOrder, userId));
    }

    @DeleteMapping("/{mediaId}")
    public ResponseEntity<Void> deleteMedia(Principal principal, @PathVariable Long mediaId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        mediaService.deleteMedia(mediaId, userId);
        return ResponseEntity.ok().build();
    }
}