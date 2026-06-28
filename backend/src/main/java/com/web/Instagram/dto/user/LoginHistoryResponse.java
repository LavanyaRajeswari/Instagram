package com.web.Instagram.dto.user;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LoginHistoryResponse {
    private Long id;
    private String ipAddress;
    private String deviceName;
    private String deviceType;
    private boolean successful;
    private LocalDateTime createdAt;
}
