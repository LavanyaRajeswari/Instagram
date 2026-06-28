package com.web.Instagram.service;

import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.entity.FollowRequest;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRequestRepository;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowRequestService {

    private final FollowRequestRepository followRequestRepository;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public void sendFollowRequest(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new RuntimeException("Cannot follow yourself");
        }

        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new RuntimeException("Already following this user");
        }

        if (followRequestRepository.existsByFollowerIdAndFollowingIdAndStatus(followerId, followingId, "PENDING")) {
            throw new RuntimeException("Follow request already sent");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FollowRequest request = FollowRequest.builder()
                .follower(follower)
                .following(following)
                .status("PENDING")
                .build();

        followRequestRepository.save(request);

        notificationService.createNotification(followingId, followerId, "FOLLOW_REQUEST", null, null, null);
    }

    @Transactional
    public void acceptFollowRequest(Long requestId, Long userId) {
        FollowRequest request = followRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Follow request not found"));

        if (!request.getFollowing().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        if (!followRepository.existsByFollowerIdAndFollowingId(
                request.getFollower().getId(),
                request.getFollowing().getId())) {
            com.web.Instagram.entity.Follow follow = new com.web.Instagram.entity.Follow();
            follow.setFollower(request.getFollower());
            follow.setFollowing(request.getFollowing());
            followRepository.save(follow);
        }

        followRequestRepository.delete(request);
    }

    @Transactional
    public void rejectFollowRequest(Long requestId, Long userId) {
        FollowRequest request = followRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Follow request not found"));

        if (!request.getFollowing().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        followRequestRepository.delete(request);
    }

    public List<UserResponse> getPendingFollowRequests(Long userId) {
        return followRequestRepository.findByFollowingIdAndStatusOrderByCreatedAtDesc(userId, "PENDING")
                .stream()
                .map(req -> {
                    User u = req.getFollower();
                    return UserResponse.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .fullName(u.getFullName())
                            .profilePicture(u.getProfilePicture())
                            .build();
                })
                .toList();
    }

    public long getPendingFollowRequestsCount(Long userId) {
        return followRequestRepository.countByFollowingIdAndStatus(userId, "PENDING");
    }

    public boolean hasPendingRequest(Long followerId, Long followingId) {
        return followRequestRepository.existsByFollowerIdAndFollowingIdAndStatus(
                followerId,
                followingId,
                "PENDING"
        );
    }

    @Transactional
    public void cancelFollowRequest(Long followerId, Long followingId) {
        followRequestRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }
}
