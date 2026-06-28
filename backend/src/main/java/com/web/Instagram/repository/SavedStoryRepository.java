package com.web.Instagram.repository;

import com.web.Instagram.entity.SavedStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SavedStoryRepository extends JpaRepository<SavedStory, Long> {
    List<SavedStory> findByUserIdOrderBySavedAtDesc(Long userId);
    boolean existsByUserIdAndStoryId(Long userId, Long storyId);
    void deleteByUserIdAndStoryId(Long userId, Long storyId);
    void deleteByStoryId(Long storyId);
}
