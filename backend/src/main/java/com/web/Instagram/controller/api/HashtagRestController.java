package com.web.Instagram.controller.api;

import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.entity.Post;
import com.web.Instagram.service.HashtagService;
import com.web.Instagram.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/hashtags")
public class HashtagRestController {

    private final HashtagService hashtagService;
    private final PostService postService;

    @GetMapping("/trending")
    public ResponseEntity<List<String>> getTrendingHashtags(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(hashtagService.getTrendingHashtags(limit));
    }

    @GetMapping("/search")
    public ResponseEntity<List<String>> searchHashtags(@RequestParam String query) {
        return ResponseEntity.ok(hashtagService.searchHashtags(query));
    }

    @GetMapping("/{tag}/posts")
    public ResponseEntity<Page<PostResponse>> getPostsByTag(
            Principal principal,
            @PathVariable String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String requesterUsername = principal != null ? principal.getName() : null;
        Page<Post> posts = hashtagService.getVisiblePostsByTag(tag, requesterUsername, page, size);
        return ResponseEntity.ok(posts.map(postService::toResponse));
    }

    @GetMapping("/{tag}/count")
    public ResponseEntity<Long> getPostCountByTag(@PathVariable String tag, Principal principal) {
        String requesterUsername = principal != null ? principal.getName() : null;
        long count = hashtagService.getVisiblePostCountByTag(tag, requesterUsername);
        return ResponseEntity.ok(count);
    }
}
