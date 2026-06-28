package com.web.Instagram.repository;

import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryLike;
import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StoryLikeRepository extends JpaRepository<StoryLike, Long> {
    boolean existsByStoryAndUser(Story story, User user);

    void deleteByStoryAndUser(Story story, User user);

    void deleteByStory(Story story);

    long countByStory(Story story);

    List<StoryLike> findByStory(Story story);

    @Query("select s.story.id, count(s) from StoryLike s where s.story.id in :ids group by s.story.id")
    List<Object[]> countByStoryIdIn(@Param("ids") List<Long> ids);

    @Query("select s.story.id from StoryLike s where s.story.id in :ids and s.user.id = :userId")
    List<Long> findLikedStoryIds(@Param("ids") List<Long> ids, @Param("userId") Long userId);
}