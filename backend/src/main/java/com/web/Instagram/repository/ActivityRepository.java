package com.web.Instagram.repository;

import com.web.Instagram.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    Optional<Activity> findByPostId(Long postId);
    List<Activity> findByPostIdIn(Collection<Long> postIds);
    List<Activity> findByUpdatedAtGreaterThanEqual(LocalDateTime updatedAt);
    void deleteByPostId(Long postId);
}
