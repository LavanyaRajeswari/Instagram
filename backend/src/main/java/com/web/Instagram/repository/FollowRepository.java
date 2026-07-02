package com.web.Instagram.repository;

import com.web.Instagram.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);

    void deleteByFollowerId(Long followerId);

    void deleteByFollowingId(Long followingId);

    long countByFollowingId(Long followingId);

    long countByFollowerId(Long followerId);

    List<Follow> findByFollowingId(Long userId);

    List<Follow> findByFollowerId(Long userId);

    Page<Follow> findByFollowingId(Long userId, Pageable pageable);

    Page<Follow> findByFollowerId(Long userId, Pageable pageable);

    @Query("select f.following.id from Follow f where f.follower.id = :userId and f.following.id in :ids")
    List<Long> findFollowingUserIds(@Param("userId") Long userId, @Param("ids") List<Long> ids);
}
