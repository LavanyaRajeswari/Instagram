package com.web.Instagram.repository;

import com.web.Instagram.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByPostId(Long postId);

    void deleteByPostId(Long postId);

    List<Tag> findByUserId(Long userId);

    long countByUserId(Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);
}