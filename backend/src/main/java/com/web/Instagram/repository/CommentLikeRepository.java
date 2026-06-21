package com.web.Instagram.repository;

import com.web.Instagram.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    boolean existsByUserIdAndCommentId(Long userId, Long commentId);

    long countByCommentId(Long commentId);

    void deleteByUserIdAndCommentId(Long userId, Long commentId);

    void deleteByCommentId(Long commentId);

    @Modifying
    @Query("delete from CommentLike cl where cl.comment.post.id = :postId")
    void deleteByCommentPostId(@Param("postId") Long postId);
}
