package com.web.Instagram.repository;

import com.web.Instagram.entity.StoryHideFrom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoryHideFromRepository extends JpaRepository<StoryHideFrom, Long> {
    List<StoryHideFrom> findByUserId(Long userId);

    Optional<StoryHideFrom> findByUserIdAndTargetUserId(Long userId, Long targetUserId);

    boolean existsByUserIdAndTargetUserId(Long userId, Long targetUserId);

    void deleteByUserIdAndTargetUserId(Long userId, Long targetUserId);
}
