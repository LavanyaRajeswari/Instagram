package com.web.Instagram.service;

import com.web.Instagram.dto.notification.NotificationResponse;
import com.web.Instagram.entity.FollowRequest;
import com.web.Instagram.entity.Notification;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRequestRepository;
import com.web.Instagram.repository.NotificationRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
            NotificationResponse response = toResponse(saved);
            messagingTemplate.convertAndSendToUser(
                recipient.getUsername(), "/queue/notifications", response);
        } catch (Exception e) {
        }

        return saved;
    }

    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private NotificationResponse toResponse(Notification n) {
        User actor = n.getSender();
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .actorId(actor != null ? actor.getId() : null)
                .actorUsername(actor != null ? actor.getUsername() : null)
                .actorProfilePicture(actor != null ? actor.getProfilePicture() : null)
                .postId(n.getPostId())
                .commentId(n.getCommentId())
                .followRequestId(getFollowRequestId(n))
                .commentText(n.getText())
                .seen(n.isSeen())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private Long getFollowRequestId(Notification notification) {
        if (!"FOLLOW_REQUEST".equalsIgnoreCase(notification.getType())
                || notification.getSender() == null
                || notification.getRecipient() == null) {
            return null;
        }

        return followRequestRepository
                .findByFollowerIdAndFollowingId(notification.getSender().getId(), notification.getRecipient().getId())
                .filter(request -> "PENDING".equalsIgnoreCase(request.getStatus()))
                .map(FollowRequest::getId)
                .orElse(null);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndSeenFalse(userId);
    }

    @Transactional
    public void markSeen(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setSeen(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllSeen(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setSeen(true));
        notificationRepository.saveAll(notifications);
    }
}
