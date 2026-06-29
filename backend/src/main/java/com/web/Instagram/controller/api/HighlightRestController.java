package com.web.Instagram.controller.api;

import com.web.Instagram.dto.highlight.HighlightResponse;
import com.web.Instagram.dto.story.StoryResponse;
import com.web.Instagram.service.HighlightService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/highlights")
@RequiredArgsConstructor
public class HighlightRestController {

    private final HighlightService highlightService;
    private final UserService userService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<HighlightResponse>> getUserHighlights(@PathVariable Long userId) {
        return ResponseEntity.ok(highlightService.getUserHighlights(userId));
    }

    @GetMapping("/{id}/stories")
    public ResponseEntity<List<StoryResponse>> getHighlightStories(Principal principal, @PathVariable Long id) {
        Long userId = principal == null ? null : userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(highlightService.getHighlightStoryResponses(id, userId));
    }

    @PostMapping
    public ResponseEntity<HighlightResponse> createHighlight(
            Principal principal,
            @RequestParam String title,
            @RequestParam List<Long> storyIds,
            @RequestParam(required = false) String coverUrl) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(highlightService.createHighlight(userId, title, storyIds, coverUrl));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HighlightResponse> updateHighlight(
            Principal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) List<Long> storyIds,
            @RequestParam(required = false) String coverUrl) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(highlightService.updateHighlight(id, userId, title, storyIds, coverUrl));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHighlight(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        highlightService.deleteHighlight(id, userId);
        return ResponseEntity.ok().build();
    }
}
