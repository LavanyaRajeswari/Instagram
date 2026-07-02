package com.web.Instagram.config;

import com.web.Instagram.repository.RefreshTokenRepository;
import com.web.Instagram.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {

    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenRepository refreshTokenRepository;
    @Scheduled(cron = "0 0 * * * *")
    public void cleanup() {
        tokenBlacklistService.removeExpiredTokens();
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupRefreshTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
