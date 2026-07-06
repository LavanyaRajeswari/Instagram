package com.web.Instagram.service;

import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.entity.Like;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.LikeRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final PostActivityPublisher postActivityPublisher;

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public void likePost(Long userId, Long postId) {
        if (likeRepository.existsByUserIdAndPostId(userId, postId)) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Like like = new Like();
        like.setUser(user);
        like.setPost(post);
        likeRepository.save(like);

        notificationService.createNotification(
                post.getUser().getId(), userId, "LIKE", postId, null, null
        );

        postActivityPublisher.publishEvent(postId, "LIKE");
    }

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public void unlikePost(Long userId, Long postId) {
        boolean existed = likeRepository.existsByUserIdAndPostId(userId, postId);
        likeRepository.deleteByUserIdAndPostId(userId, postId);
        if (existed) {
            postActivityPublisher.publishEvent(postId, "UNLIKE");
        }
    }

    public long getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean isLiked(Long userId, Long postId) {
        return likeRepository.existsByUserIdAndPostId(userId, postId);
    }

    public List<UserResponse> getUsersWhoLikedPost(Long postId) {
        return likeRepository.findUsersByPostId(postId)
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .profilePicture(user.getProfilePicture())
                        .build())
                .collect(Collectors.toList());
    }
}
