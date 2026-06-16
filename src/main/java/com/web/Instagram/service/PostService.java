package com.web.Instagram.service;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Post getPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));
    }

    public Post createPost(Long userId, String caption, MultipartFile[] images) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<String> imageUrls = Arrays.stream(images)
                .map(file -> "/uploads/" + file.getOriginalFilename())
                .toList();

        Post post = new Post();
        post.setUser(user);
        post.setCaption(caption);
        post.setImageUrls(imageUrls);
        return postRepository.save(post);
    }

    public Post editPost(Long postId, String caption, MultipartFile[] images) {
        Post post = getPost(postId);
        post.setCaption(caption);

        if (images != null && images.length > 0) {
            List<String> imageUrls = Arrays.stream(images)
                    .map(file -> "/uploads/" + file.getOriginalFilename())
                    .toList();
            post.setImageUrls(imageUrls);
        }

        return postRepository.save(post);
    }

    public void deletePost(Long postId) {
        Post post = getPost(postId);
        postRepository.delete(post);
    }

}