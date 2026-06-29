package com.web.Instagram.service;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.entity.Notification;
import com.web.Instagram.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final NotificationRepository notificationRepository;

    public List<NotificationResponse> getRecentActivity(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50))
            .stream()
            .map(n -> NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .actorId(n.getSender() != null ? n.getSender().getId() : null)
                .actorUsername(n.getSender() != null ? n.getSender().getUsername() : null)
                .actorProfilePicture(n.getSender() != null ? n.getSender().getProfilePicture() : null)
                .postId(n.getPostId())
                .commentId(n.getCommentId())
                .commentText(n.getText())
                .seen(n.isSeen())
                .createdAt(n.getCreatedAt())
                .build())
            .toList();
    }
}
