package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.service.PostService;
import com.web.Instagram.service.UserService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.antlr.v4.runtime.tree.pattern.ParseTreePattern;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.web.Instagram.repository.PostRepository;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostRestController {

    private final PostService postService;
    private final PostRepository postRepository;
    

   @GetMapping
    public List<Post> getAllPosts() {
        return postService.getAllPosts();
    }

    @GetMapping("/explore")
    public List<Post> getExplorePosts() {
        return postRepository.findExplorePostsByEngagement();
    }

    @GetMapping("/search")
    public List<Post> searchPosts(@RequestParam String query) {
        return postRepository.searchPosts(query.trim());
    }

    @GetMapping("/{id}")
    public Post getPost(@PathVariable Long id) {
        return postService.getPost(id);
    }
    
    @PostMapping(consumes = "multipart/form-data")
    public Post createPost(@RequestParam Long userId, @RequestParam(required = false) String caption, @RequestParam MultipartFile[] images) {
        return postService.createPost(
                userId,
                caption,
                images
        );
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public Post editPost(
            @PathVariable Long id,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false)
            MultipartFile[] images) {

        return postService.editPost(
                id,
                caption,
                images
        );
    }

    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable Long id) {
        postService.deletePost(id);
    }
}