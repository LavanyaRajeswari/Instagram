package com.web.Instagram.repository;

import com.web.Instagram.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    boolean existsByUserIdAndCommentId(Long userId, Long commentId);

    long countByCommentId(Long commentId);

    @Query("select cl.comment.id, count(cl) from CommentLike cl where cl.comment.id in :ids group by cl.comment.id")
    List<Object[]> countByCommentIdIn(@Param("ids") List<Long> ids);

    void deleteByUserIdAndCommentId(Long userId, Long commentId);

    void deleteByCommentId(Long commentId);

    @Modifying
    @Query("delete from CommentLike cl where cl.comment.post.id = :postId")
    void deleteByCommentPostId(@Param("postId") Long postId);

    @Modifying
    @Query("delete from CommentLike cl where cl.comment.id in :commentIds")
    void deleteByCommentIds(@Param("commentIds") List<Long> commentIds);
}