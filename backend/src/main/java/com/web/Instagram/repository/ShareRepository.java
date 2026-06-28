package com.web.Instagram.repository;

import com.web.Instagram.entity.Share;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShareRepository extends JpaRepository<Share, Long> {

    long countByPostId(Long postId);

    long countByStoryId(Long storyId);

    @Modifying
    @Query("delete from Share s where s.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    @Modifying
    @Query("delete from Share s where s.storyId = :storyId")
    void deleteByStoryId(@Param("storyId") Long storyId);

    @Query("select s.post.id, count(s) from Share s where s.post.id in :ids group by s.post.id")
    List<Object[]> countByPostIdIn(@Param("ids") List<Long> ids);
}