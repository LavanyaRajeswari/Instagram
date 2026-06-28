package com.web.Instagram.service;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.entity.Notification;
import com.web.Instagram.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final NotificationRepository notificationRepository;

    public List<NotificationResponse> getRecentActivity(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        List<NotificationResponse> activities = new ArrayList<>();

        for (Notification n : notifications) {
            NotificationResponse response = NotificationResponse.builder()
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
                .build();
            activities.add(response);
        }

        activities.sort(Comparator.comparing(NotificationResponse::getCreatedAt).reversed());
        return activities.size() > 50 ? activities.subList(0, 50) : activities;
    }
}
