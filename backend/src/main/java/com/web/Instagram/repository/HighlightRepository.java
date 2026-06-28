package com.web.Instagram.repository;

import com.web.Instagram.entity.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {
    List<Highlight> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Highlight> findByStoriesId(Long storyId);
}
