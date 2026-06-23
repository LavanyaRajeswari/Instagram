package com.web.Instagram.repository;

import com.web.Instagram.entity.PostDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostDraftRepository extends JpaRepository<PostDraft, Long> {
    List<PostDraft> findByUserIdOrderByUpdatedAtDesc(Long userId);
    void deleteByUserId(Long userId);
}