package com.web.Instagram.repository;

import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    List<StoryView> findByStoryIdOrderByViewedAtDesc(Long storyId);

    Optional<StoryView> findByStoryIdAndUserId(Long storyId, Long userId);

    long countByStoryId(Long storyId);

    boolean existsByStoryIdAndUserId(Long storyId, Long userId);

    void deleteByStory(Story story);

    @Query("select v.story.id, count(v) from StoryView v where v.story.id in :ids group by v.story.id")
    List<Object[]> countByStoryIdIn(@Param("ids") List<Long> ids);
}