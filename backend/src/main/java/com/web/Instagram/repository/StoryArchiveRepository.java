package com.web.Instagram.repository;

import com.web.Instagram.entity.StoryArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryArchiveRepository extends JpaRepository<StoryArchive, Long> {
    List<StoryArchive> findByUserIdOrderByArchivedAtDesc(Long userId);
    List<StoryArchive> findByUserIdAndArchivedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
}
