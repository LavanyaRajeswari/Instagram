package com.web.Instagram.dto.highlight;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HighlightResponse {
    private Long id;
    private String title;
    private String coverUrl;
    private List<Long> storyIds;
}