package com.web.Instagram.repository;

import com.web.Instagram.entity.Like;
import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    void deleteByPostId(Long postId);

    @Query("SELECT l.user FROM Like l WHERE l.post.id = :postId ORDER BY l.createdAt DESC")
    List<User> findUsersByPostId(@Param("postId") Long postId);

    @Query("select l.post.id, count(l) from Like l where l.post.id in :ids group by l.post.id")
    List<Object[]> countByPostIdIn(@Param("ids") List<Long> ids);
}