package com.web.Instagram.repository;

import com.web.Instagram.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;

import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);
    List<Story> findByUserId(Long userId);

    @Query("select s from Story s join fetch s.user where s.expiresAt > :now and (s.user in :followedUsers or s.user = :currentUser) order by s.createdAt desc")
    List<Story> findActiveStoriesByFollowedUsers(@Param("now") LocalDateTime now, @Param("followedUsers") List<User> followedUsers, @Param("currentUser") User currentUser);
}
