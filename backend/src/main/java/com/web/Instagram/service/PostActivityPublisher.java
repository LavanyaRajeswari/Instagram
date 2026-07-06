package com.web.Instagram.service;

import com.web.Instagram.dto.feed.PostActivityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostActivityPublisher {

    private final KafkaTemplate<String, PostActivityEvent> kafkaTemplate;

    @Value("${app.kafka.topic.post-activity:post-activity-events}")
    private String topicName;

    public void publishEvent(Long postId, String eventType) {
        if (postId == null) return;
        PostActivityEvent event = PostActivityEvent.builder()
                .postId(postId)
                .eventType(eventType)
                .timestamp(System.currentTimeMillis())
                .build();
        log.info("Publishing event to Kafka: {}", event);
        try {
            kafkaTemplate.send(topicName, postId.toString(), event);
        } catch (Exception e) {
            log.error("Failed to publish event to Kafka for post: {}", postId, e);
        }
    }
}
