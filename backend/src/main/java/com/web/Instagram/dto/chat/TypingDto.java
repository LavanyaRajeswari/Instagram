package com.web.Instagram.dto.chat;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingDto {
    private Long chatId;
    private Long userId;
    private boolean typing;
}