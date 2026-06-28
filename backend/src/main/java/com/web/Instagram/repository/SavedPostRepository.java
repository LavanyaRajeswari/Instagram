package com.web.Instagram.repository;

import com.web.Instagram.entity.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    void deleteByPostId(Long postId);

    List<SavedPost> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select s.post.id, count(s) from SavedPost s where s.post.id in :ids group by s.post.id")
    List<Object[]> countByPostIdIn(@Param("ids") List<Long> ids);
}