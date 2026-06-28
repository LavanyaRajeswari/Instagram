package com.web.Instagram.service;

import com.web.Instagram.entity.Report;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.ReportRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public Report createReport(Long reporterId, String targetType, Long targetId, String reason, String description) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(reporterId, targetType, targetId)) {
            throw new RuntimeException("You have already reported this");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .description(description)
                .status("PENDING")
                .build();

        return reportRepository.save(report);
    }

    public Page<Report> getReports(String status, int page, int size) {
        return reportRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
    }

    public List<Report> getUserReports(Long userId) {
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void updateReportStatus(Long reportId, String status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(status);
        reportRepository.save(report);
    }

    public long getPendingCount() {
        return reportRepository.countByStatus("PENDING");
    }

    @Transactional
    public void bulkResolve(List<Long> reportIds) {
        reportRepository.findAllById(reportIds).forEach(report -> {
            report.setStatus("RESOLVED");
            reportRepository.save(report);
        });
    }

    public Map<String, Object> getReportAnalytics() {
        return Map.of(
            "byStatus", Map.of(
                "PENDING", reportRepository.countByStatus("PENDING"),
                "RESOLVED", reportRepository.countByStatus("RESOLVED"),
                "DISMISSED", reportRepository.countByStatus("DISMISSED")
            ),
            "byReason", Map.of(
                "SPAM", countByReason("SPAM"),
                "HARASSMENT", countByReason("HARASSMENT"),
                "INAPPROPRIATE", countByReason("INAPPROPRIATE"),
                "OTHER", countByReason("OTHER")
            ),
            "byTargetType", Map.of(
                "POST", reportRepository.countByTargetType("POST"),
                "USER", reportRepository.countByTargetType("USER"),
                "COMMENT", reportRepository.countByTargetType("COMMENT"),
                "STORY", reportRepository.countByTargetType("STORY")
            )
        );
    }

    public long getReportCountByStatus(String status) {
        return reportRepository.countByStatus(status);
    }

    private long countByReason(String reason) {
        return reportRepository.findAll().stream()
            .filter(r -> r.getReason().equalsIgnoreCase(reason))
            .count();
    }
}