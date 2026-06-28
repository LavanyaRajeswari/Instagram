package com.web.Instagram.config;

import com.web.Instagram.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {

    private final TokenBlacklistService tokenBlacklistService;

    @Scheduled(cron = "0 0 * * * *")
    public void cleanup() {
        tokenBlacklistService.removeExpiredTokens();
    }
}