package com.web.Instagram.dto.feed;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostActivityEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long postId;
    private String eventType;
    private Long timestamp;

}
