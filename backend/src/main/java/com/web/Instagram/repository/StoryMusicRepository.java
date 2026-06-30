package com.web.Instagram.repository;

import com.web.Instagram.entity.StoryMusic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryMusicRepository extends JpaRepository<StoryMusic, Long> {
    Page<StoryMusic> findByTitleContainingIgnoreCase(String query, Pageable pageable);

    @org.springframework.data.jpa.repository.Query(
        "SELECT s FROM StoryMusic s WHERE LOWER(s.title) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(s.artist) LIKE LOWER(CONCAT('%',:q,'%')) ORDER BY s.usageCount DESC"
    )
    Page<StoryMusic> searchByTitleOrArtist(@org.springframework.data.repository.query.Param("q") String query, Pageable pageable);
    List<StoryMusic> findTop10ByOrderByUsageCountDesc();
    List<StoryMusic> findAllByOrderByUsageCountDesc();
}
