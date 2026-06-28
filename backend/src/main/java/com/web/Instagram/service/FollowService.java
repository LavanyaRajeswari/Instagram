package com.web.Instagram.service;

import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.entity.Follow;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FollowRequestService followRequestService;

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "feed"}, allEntries = true)
    public void followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new RuntimeException("You cannot follow yourself");
        }

        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) return;

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Follower user not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("Following user not found"));

        if (Boolean.TRUE.equals(following.getIsPrivate())) {
            followRequestService.sendFollowRequest(followerId, followingId);
            return;
        }

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        followRepository.save(follow);

        notificationService.createNotification(followingId, followerId, "FOLLOW", null, null, null);
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "feed"}, allEntries = true)
    public void unfollowUser(Long followerId, Long followingId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    public long getFollowersCount(Long userId) {
        return followRepository.countByFollowingId(userId);
    }

    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerId(userId);
    }

    public Page<UserResponse> getFollowersUsers(Long userId, Pageable pageable) {
        return followRepository.findByFollowingId(userId, pageable)
                .map(follow -> UserResponse.builder()
                        .id(follow.getFollower().getId())
                        .username(follow.getFollower().getUsername())
                        .fullName(follow.getFollower().getFullName())
                        .profilePicture(follow.getFollower().getProfilePicture())
                        .build());
    }

    public Page<UserResponse> getFollowingUsers(Long userId, Pageable pageable) {
        return followRepository.findByFollowerId(userId, pageable)
                .map(follow -> UserResponse.builder()
                        .id(follow.getFollowing().getId())
                        .username(follow.getFollowing().getUsername())
                        .fullName(follow.getFollowing().getFullName())
                        .profilePicture(follow.getFollowing().getProfilePicture())
                        .build());
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "feed"}, allEntries = true)
    public void removeFollower(Long userId, Long followerId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, userId);
    }

    public List<User> getFollowersUsers(Long userId) {
        return followRepository.findByFollowingId(userId)
                .stream()
                .map(Follow::getFollower)
                .toList();
    }

    public List<User> getFollowingUsers(Long userId) {
        return followRepository.findByFollowerId(userId)
                .stream()
                .map(Follow::getFollowing)
                .toList();
    }
}
