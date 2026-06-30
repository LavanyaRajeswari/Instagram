package com.web.Instagram.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

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
