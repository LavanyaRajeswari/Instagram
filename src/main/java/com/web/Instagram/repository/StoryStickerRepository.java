package com.web.Instagram.repository;

import com.web.Instagram.entity.StorySticker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoryStickerRepository extends JpaRepository<StorySticker, Long> {
    List<StorySticker> findByStoryId(Long storyId);
    void deleteByStoryId(Long storyId);
}