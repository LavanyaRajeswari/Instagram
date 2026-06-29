package com.web.Instagram.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(1)
public class RateLimitingFilter implements Filter {

    private final Map<String, UserRequestTracker> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final long WINDOW_SIZE_MS = 60_000;

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") || path.startsWith("/api/users/register") || path.startsWith("/api/users/login")) {
            String ip = request.getRemoteAddr();
            String key = ip + ":" + path;
            UserRequestTracker tracker = requestCounts.computeIfAbsent(key, k -> new UserRequestTracker());

            if (!tracker.allowRequest()) {
                response.setStatus(429);
                response.getWriter().write("Too many requests. Please try again later.");
                return;
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }

    @Scheduled(fixedRate = 60_000)
    public void cleanupStaleEntries() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, UserRequestTracker>> it = requestCounts.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, UserRequestTracker> entry = it.next();
            if (now - entry.getValue().windowStart > WINDOW_SIZE_MS) {
                it.remove();
            }
        }
    }

    private static class UserRequestTracker {
        private final AtomicInteger count = new AtomicInteger(0);
        long windowStart = System.currentTimeMillis();

        public boolean allowRequest() {
            long now = System.currentTimeMillis();
            if (now - windowStart > WINDOW_SIZE_MS) {
                count.set(0);
                windowStart = now;
            }
            return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}