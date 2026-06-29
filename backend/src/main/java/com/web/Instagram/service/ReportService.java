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
}