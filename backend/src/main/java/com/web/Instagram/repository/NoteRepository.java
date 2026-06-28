package com.web.Instagram.repository;

import com.web.Instagram.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime now);
    List<Note> findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);
    List<Note> findByExpiresAtAfterAndAudienceInOrderByCreatedAtDesc(LocalDateTime now, List<String> audiences);
    List<Note> findByUserIdAndExpiresAtAfterAndAudienceInOrderByCreatedAtDesc(Long userId, LocalDateTime now, List<String> audiences);
    List<Note> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}