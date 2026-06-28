package com.web.Instagram.controller.api;

import com.web.Instagram.entity.Report;
import com.web.Instagram.service.ReportService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports")
public class ReportRestController {

    private final ReportService reportService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<?> createReport(
            Principal principal,
            @RequestBody Map<String, Object> body) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        String targetType = body.get("targetType") instanceof String t ? t : null;
        Object targetIdObj = body.get("targetId");
        Long targetId = targetIdObj instanceof Number n ? n.longValue() :
                targetIdObj != null ? Long.valueOf(targetIdObj.toString()) : null;
        String reason = body.get("reason") instanceof String r ? r : null;
        String description = body.get("description") instanceof String d ? d : "";
        if (targetType == null || reason == null || targetId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "targetType, targetId, and reason are required"));
        }
        return ResponseEntity.ok(reportService.createReport(userId, targetType, targetId, reason, description));
    }

    @GetMapping("/my")
    public ResponseEntity<java.util.List<Report>> getMyReports(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(reportService.getUserReports(userId));
    }

}