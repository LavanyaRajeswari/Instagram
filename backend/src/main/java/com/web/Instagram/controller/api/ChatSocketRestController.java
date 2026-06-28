package com.web.Instagram.controller.api;

import com.web.Instagram.dto.chat.MessageDto;
import com.web.Instagram.dto.chat.SendMessageRequest;
import com.web.Instagram.dto.chat.TypingDto;
import com.web.Instagram.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatSocketRestController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request) {
        MessageDto message = messageService.sendMessage(request);
        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getChatId(),
                message
        );
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingDto dto) {
        messagingTemplate.convertAndSend(
                "/topic/chat/" + dto.getChatId() + "/typing",
                dto
        );
    }
}