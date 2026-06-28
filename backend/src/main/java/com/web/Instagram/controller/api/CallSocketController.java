package com.web.Instagram.controller.api;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CallSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    @MessageMapping("/call.offer")
    public void handleOffer(@Payload Map<String, Object> payload) {
        Object calleeIdObj = payload.get("calleeId");
        if (calleeIdObj instanceof Number calleeId) {
            messagingTemplate.convertAndSend(
                    "/queue/call/" + calleeId.longValue(),
                    payload
            );
        }
    }

    @MessageMapping("/call.answer")
    public void handleAnswer(@Payload Map<String, Object> payload) {
        Object callerIdObj = payload.get("callerId");
        if (callerIdObj instanceof Number callerId) {
            messagingTemplate.convertAndSend(
                    "/queue/call/" + callerId.longValue(),
                    payload
            );
        }
    }

    @MessageMapping("/call.ice-candidate")
    public void handleIceCandidate(@Payload Map<String, Object> payload) {
        Object targetIdObj = payload.get("targetId");
        if (targetIdObj instanceof Number targetId) {
            messagingTemplate.convertAndSend(
                    "/queue/call/" + targetId.longValue(),
                    payload
            );
        }
    }

    @MessageMapping("/call.end")
    public void handleEnd(@Payload Map<String, Object> payload) {
        Object targetIdObj = payload.get("targetId");
        if (targetIdObj instanceof Number targetId) {
            messagingTemplate.convertAndSend(
                    "/queue/call/" + targetId.longValue(),
                    payload
            );
        }
    }
}
