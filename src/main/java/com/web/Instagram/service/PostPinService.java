package com.web.Instagram.service;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.PostPin;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.PostPinRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostPinService {

    private final PostPinRepository postPinRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Transactional
    public void pinPost(Long userId, Long postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Can only pin your own posts");
        }

        if (postPinRepository.existsByUserIdAndPostId(userId, postId)) {
            return;
        }

        postPinRepository.findByUserId(userId).ifPresent(postPinRepository::delete);

        PostPin pin = PostPin.builder()
                .user(user)
                .post(post)
                .build();
        postPinRepository.save(pin);
    }

    @Transactional
    public void unpinPost(Long userId, Long postId) {
        postPinRepository.deleteByUserIdAndPostId(userId, postId);
    }

    public boolean isPinned(Long userId, Long postId) {
        return postPinRepository.existsByUserIdAndPostId(userId, postId);
    }

    public Long getPinnedPostId(Long userId) {
        return postPinRepository.findByUserId(userId)
                .map(pin -> pin.getPost().getId())
                .orElse(null);
    }
}