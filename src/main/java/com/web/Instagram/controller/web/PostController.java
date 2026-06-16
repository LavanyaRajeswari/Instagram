package com.web.Instagram.controller.web;

import com.web.Instagram.entity.Post;
import com.web.Instagram.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequiredArgsConstructor
@RequestMapping("/posts")
public class PostController {

    private final PostService postService;

    @GetMapping("/create")
    public String showCreatePostForm() {
        return "post/create";
    }

    @PostMapping("/create")
    public String createPost(
            @RequestParam Long userId,
            @RequestParam(required = false) String caption,
            @RequestParam MultipartFile[] images) {

        Post post = postService.createPost(
                userId,
                caption,
                images
        );

        return "redirect:/posts/" + post.getId();
    }

    @GetMapping("/{postId}")
    public String viewPost(@PathVariable Long postId, Model model) {
        model.addAttribute("post", postService.getPost(postId));
        return "post/view";
    }

    @GetMapping("/{postId}/edit")
    public String showEditPostForm(@PathVariable Long postId, Model model) {
        model.addAttribute("post", postService.getPost(postId));
        return "post/edit";
    }

    @PostMapping("/{postId}/edit")
    public String editPost(
            @PathVariable Long postId,
            @RequestParam String caption,
            @RequestParam(required = false) MultipartFile[] images) {

        postService.editPost(
                postId,
                caption,
                images
        );

        return "redirect:/posts/" + postId;
    }

    @PostMapping("/{postId}/delete")
    public String deletePost(
            @PathVariable Long postId) {

        postService.deletePost(postId);

        return "redirect:/posts";
    }
}