package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Tag;
import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.service.PostService;
import com.web.Instagram.service.TagService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tags")
public class TagRestController {

    private final TagService tagService;
    private final UserService userService;
    private final PostService postService;

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Tag>> getPostTags(@PathVariable Long postId) {
        return ResponseEntity.ok(tagService.getPostTags(postId));
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<Void> tagUserInPost(
            Principal principal,
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body) {
        Object userIdObj = body.get("userId");
        if (userIdObj == null) {
            return ResponseEntity.badRequest().build();
        }
        Long taggedUserId = Long.valueOf(userIdObj.toString());
        Double x = body.get("x") != null ? Double.valueOf(body.get("x").toString()) : 0.0;
        Double y = body.get("y") != null ? Double.valueOf(body.get("y").toString()) : 0.0;
        Long taggerId = userService.getCurrentUser(principal.getName()).getId();
        tagService.tagUserInPost(postId, taggerId, taggedUserId, x, y);
        return ResponseEntity.ok().build();
    }

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
