package com.web.Instagram.repository;

import com.web.Instagram.entity.Follow;
import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    long countByFollower(User user);

    long countByFollowing(User user);

    boolean existsByFollowerAndFollowing(
            User follower,
            User following
    );

    void deleteByFollowerAndFollowing(
            User follower,
            User following
    );
}