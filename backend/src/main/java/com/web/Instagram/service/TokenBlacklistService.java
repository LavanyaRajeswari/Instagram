package com.web.Instagram.service;

import com.web.Instagram.entity.BlacklistedToken;
import com.web.Instagram.repository.BlacklistedTokenRepository;
import com.web.Instagram.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final JwtService jwtService;

    public void blacklist(String token) {

        if (blacklistedTokenRepository.existsByToken(token)) {
            return;
        }

        BlacklistedToken blacklistedToken = BlacklistedToken.builder()
                .token(token)
                .blacklistedAt(LocalDateTime.now())
                .expiresAt(
                        jwtService.extractExpiration(token)
                                .toInstant()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDateTime()
                )
                .build();

        blacklistedTokenRepository.save(blacklistedToken);
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }

    public void removeExpiredTokens() {
        blacklistedTokenRepository.deleteByExpiresAtBefore(
                LocalDateTime.now()
        );
    }
}