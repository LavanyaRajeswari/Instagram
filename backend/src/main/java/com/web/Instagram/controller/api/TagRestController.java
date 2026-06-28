package com.web.Instagram.controller.api;

import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.service.PostService;
import com.web.Instagram.service.TagService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tags")
public class TagRestController {

    private final TagService tagService;
    private final UserService userService;
    private final PostService postService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserTags(Principal principal, @PathVariable Long userId) {
        String requesterUsername = principal != null ? principal.getName() : null;
        List<PostResponse> posts = tagService.getTaggedPostIds(userId).stream()
                .map(postService::getPost)
                .filter(post -> post.getUser() != null)
                .filter(post -> userService.canViewUserPosts(requesterUsername, post.getUser().getId()))
                .toList();
        return ResponseEntity.ok(posts);
    }
}
