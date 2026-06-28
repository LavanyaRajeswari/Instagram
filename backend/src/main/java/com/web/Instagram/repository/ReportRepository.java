package com.web.Instagram.repository;

import com.web.Instagram.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatusOrderByCreatedAtDesc(String status);
    Page<Report> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    List<Report> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
    long countByStatus(String status);
    boolean existsByReporterIdAndTargetTypeAndTargetId(Long reporterId, String targetType, Long targetId);
    long countByTargetType(String targetType);
}