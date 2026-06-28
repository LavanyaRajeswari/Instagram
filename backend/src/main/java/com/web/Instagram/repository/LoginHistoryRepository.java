package com.web.Instagram.repository;

import com.web.Instagram.entity.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    List<LoginHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndSuccessfulFalseAndCreatedAtAfter(Long userId, java.time.LocalDateTime after);
}