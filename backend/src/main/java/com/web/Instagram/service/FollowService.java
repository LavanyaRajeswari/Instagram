package com.web.Instagram.service;

import com.web.Instagram.entity.Follow;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public void followUser(
            Long targetUserId,
            User currentUser
    ) {

        User targetUser =
                userRepository.findById(
                        targetUserId
                ).orElseThrow();

        if (
                followRepository
                        .existsByFollowerAndFollowing(
                                currentUser,
                                targetUser
                        )
        ) {
            return;
        }

        Follow follow =
                Follow.builder()
                        .follower(currentUser)
                        .following(targetUser)
                        .build();

        followRepository.save(follow);
    }

    public void unfollowUser(
            Long targetUserId,
            User currentUser
    ) {

        User targetUser =
                userRepository.findById(
                        targetUserId
                ).orElseThrow();

        followRepository
                .deleteByFollowerAndFollowing(
                        currentUser,
                        targetUser
                );
    }
}
