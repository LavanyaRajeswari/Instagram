package com.web.Instagram.controller.api;

import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.service.PostService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reels")
public class ReelsRestController {

    private final PostService postService;
    private final UserService userService;

    @GetMapping
    public Page<PostResponse> getReels(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = principal != null ? userService.getCurrentUser(principal.getName()).getId() : null;
        return postService.getReels(userId, page, size);
    }

    @GetMapping("/search")
    public Page<PostResponse> searchReels(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return postService.searchPosts(query, org.springframework.data.domain.PageRequest.of(page, size));
    }

}