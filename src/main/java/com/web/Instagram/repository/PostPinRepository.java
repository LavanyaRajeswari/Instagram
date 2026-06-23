package com.web.Instagram.repository;

import com.web.Instagram.entity.PostPin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostPinRepository extends JpaRepository<PostPin, Long> {
    Optional<PostPin> findByUserIdAndPostId(Long userId, Long postId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    Optional<PostPin> findByUserId(Long userId);
    void deleteByUserIdAndPostId(Long userId, Long postId);
    long countByUserId(Long userId);
}