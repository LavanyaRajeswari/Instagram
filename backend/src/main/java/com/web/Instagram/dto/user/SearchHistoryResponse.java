package com.web.Instagram.dto.user;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SearchHistoryResponse {
    private Long id;
    private String query;
    private String type;
    private Long targetId;
    private LocalDateTime createdAt;
}
