package com.web.Instagram.repository;

import com.web.Instagram.entity.FollowRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FollowRequestRepository extends JpaRepository<FollowRequest, Long> {
    Optional<FollowRequest> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    boolean existsByFollowerIdAndFollowingIdAndStatus(Long followerId, Long followingId, String status);
    List<FollowRequest> findByFollowingIdAndStatusOrderByCreatedAtDesc(Long followingId, String status);
    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);
    long countByFollowingIdAndStatus(Long followingId, String status);
}