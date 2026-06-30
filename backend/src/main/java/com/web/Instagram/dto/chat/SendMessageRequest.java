package com.web.Instagram.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull
    private Long chatId;

    private String content;

    private String messageType;

    private String mediaUrl;

    private String mediaType;

    private Long replyToId;

    private boolean forwarded;

    private Long forwardedFromId;
}
