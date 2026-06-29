package com.web.Instagram.service;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.entity.Notification;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRequestRepository;
import com.web.Instagram.repository.NotificationRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final FollowRequestRepository followRequestRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification createNotification(Long recipientId, Long senderId, String type, Long postId, Long commentId, String text) {
        if (recipientId.equals(senderId)) return null;

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .postId(postId)
                .commentId(commentId)
                .text(text)
                .seen(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        try {
            NotificationResponse response = toResponse(saved, java.util.Collections.emptyMap());
            messagingTemplate.convertAndSendToUser(
                recipient.getUsername(), "/queue/notifications", response);
        } catch (Exception e) {
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        List<Notification> notifications =
                notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);

        // Batch-load all pending follow requests for this user to avoid N+1 queries
        Map<Long, Long> pendingFollowRequestBySenderId = new HashMap<>();
        boolean hasFollowRequests = notifications.stream()
                .anyMatch(n -> "FOLLOW_REQUEST".equalsIgnoreCase(n.getType()));
        if (hasFollowRequests) {
            followRequestRepository
                    .findByFollowingIdAndStatusOrderByCreatedAtDesc(userId, "PENDING")
                    .forEach(fr -> pendingFollowRequestBySenderId.put(fr.getFollower().getId(), fr.getId()));
        }

        return notifications.stream()
                .map(n -> toResponse(n, pendingFollowRequestBySenderId))
                .toList();
    }

    private NotificationResponse toResponse(Notification n, Map<Long, Long> pendingFollowRequestBySenderId) {
        User actor = n.getSender();
        Long followRequestId = null;
        if ("FOLLOW_REQUEST".equalsIgnoreCase(n.getType()) && actor != null) {
            followRequestId = pendingFollowRequestBySenderId.get(actor.getId());
        }
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .actorId(actor != null ? actor.getId() : null)
                .actorUsername(actor != null ? actor.getUsername() : null)
                .actorProfilePicture(actor != null ? actor.getProfilePicture() : null)
                .postId(n.getPostId())
                .commentId(n.getCommentId())
                .followRequestId(followRequestId)
                .commentText(n.getText())
                .seen(n.isSeen())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndSeenFalse(userId);
    }

    @Transactional
    public void markSeen(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Notification does not belong to you");
        }
        notification.setSeen(true);
        notificationRepository.save(notification);
    }

}
