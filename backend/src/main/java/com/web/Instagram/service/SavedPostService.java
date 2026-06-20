package com.web.Instagram.service;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.SavedPost;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.SavedPostRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Transactional
    public void savePost(Long userId, Long postId) {
        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        SavedPost savedPost = new SavedPost();
        savedPost.setUser(user);
        savedPost.setPost(post);

        savedPostRepository.save(savedPost);
    }

    @Transactional
    public void unsavePost(Long userId, Long postId) {
        savedPostRepository.deleteByUserIdAndPostId(userId, postId);
    }

    public boolean isPostSaved(Long userId, Long postId) {
        return savedPostRepository.existsByUserIdAndPostId(userId, postId);
    }

    public List<Post> getSavedPosts(Long userId) {
        return savedPostRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(SavedPost::getPost)
                .toList();
    }
}