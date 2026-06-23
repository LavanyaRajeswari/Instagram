package com.web.Instagram.repository;

import com.web.Instagram.entity.StoryArchive;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoryArchiveRepository extends JpaRepository<StoryArchive, Long> {
    List<StoryArchive> findByUserIdOrderByArchivedAtDesc(Long userId);
    Page<StoryArchive> findByUserIdOrderByArchivedAtDesc(Long userId, Pageable pageable);
}