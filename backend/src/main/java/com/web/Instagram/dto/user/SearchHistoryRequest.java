package com.web.Instagram.dto.user;

import lombok.Data;

@Data
public class SearchHistoryRequest {
    private String query;
    private String type;
    private Long targetId;
}
