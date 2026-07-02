package com.web.Instagram.service;

import com.web.Instagram.dto.chat.MessageDto;
import com.web.Instagram.dto.chat.SendMessageRequest;
import com.web.Instagram.entity.Chat;
import com.web.Instagram.entity.Message;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.ChatRepository;
import com.web.Instagram.repository.MessageRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    public Page<MessageDto> getMessages(
            Long chatId,
            int page,
            int size
    ) {

        Chat chat = chatRepository
                .findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        validateParticipant(chat);

        Page<Message> messages = messageRepository.findActiveByChatId(
                chatId,
                PageRequest.of(
                        page,
                        size,
                        Sort.by("createdAt").descending()
                )
        );

        return messages.map(this::convert);
    }

    public MessageDto sendMessage(
            SendMessageRequest request
    ) {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User sender = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = chatRepository
                .findById(request.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        validateParticipant(chat);

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setMessageType(request.getMessageType() != null ? request.getMessageType() : "TEXT");
        message.setMediaUrl(request.getMediaUrl());
        message.setMediaType(request.getMediaType());
        message.setForwarded(request.isForwarded());
        message.setForwardedFrom(request.getForwardedFromId() != null
                ? userRepository.findById(request.getForwardedFromId()).orElse(null) : null);

        if (request.getReplyToId() != null) {
            message.setReplyTo(messageRepository.findById(request.getReplyToId()).orElse(null));
        }

        message = messageRepository.save(message);

        chat.setLastMessage(request.getContent() != null ? request.getContent() : "[Media]");
        chat.setLastMessageAt(message.getCreatedAt());
        chatRepository.save(chat);

        return convert(message);
    }

    @Transactional
    public void markSeen(Long chatId) {
        Chat chat = chatRepository
                .findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat);
        messageRepository.markAllAsSeen(chatId);
    }

    @Transactional
    public void deleteMessage(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }
        message.setDeleted(true);
        messageRepository.save(message);
    }

    @Transactional
    public MessageDto editMessage(Long messageId, String content) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }
        message.setContent(content);
        return convert(messageRepository.save(message));
    }

    @Transactional
    public MessageDto reactToMessage(Long messageId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        validateParticipant(message.getChat());
        User currentUser = getCurrentUser();
        message.setReactions(setReaction(message.getReactions(), emoji, currentUser.getId()));
        return convert(messageRepository.save(message));
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateParticipant(Chat chat) {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User currentUser = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean participant =
                chat.getUserOne().getId().equals(currentUser.getId())
                        || chat.getUserTwo().getId().equals(currentUser.getId());

        if (!participant) {
            throw new RuntimeException("Access denied");
        }
    }

    private MessageDto convert(Message message) {

        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender().getId());
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType());
        dto.setMediaUrl(message.getMediaUrl());
        dto.setMediaType(message.getMediaType());
        dto.setReplyToId(message.getReplyTo() != null ? message.getReplyTo().getId() : null);
        dto.setForwarded(message.isForwarded());
        dto.setForwardedFromId(message.getForwardedFrom() != null ? message.getForwardedFrom().getId() : null);
        dto.setDeleted(message.isDeleted());
        dto.setSeen(message.isSeen());
        dto.setReactions(message.getReactions());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }

    private String setReaction(String existing, String emoji, Long userId) {
        if (emoji == null || emoji.isBlank()) return existing;
        Map<String, java.util.LinkedHashSet<Long>> reactions = new LinkedHashMap<>();
        if (existing != null && !existing.isBlank()) {
            for (String entry : existing.split(";")) {
                String[] parts = entry.split("=", 2);
                if (parts.length != 2) continue;
                java.util.LinkedHashSet<Long> users = new java.util.LinkedHashSet<>();
                if (parts[1].startsWith("u:")) {
                    for (String id : parts[1].substring(2).split(",")) {
                        try {
                            users.add(Long.parseLong(id));
                        } catch (NumberFormatException ignored) {
                        }
                    }
                } else {
                    try {
                        int count = Integer.parseInt(parts[1]);
                        for (long i = 0; i < count; i++) users.add(-Math.abs((long) parts[0].hashCode()) - i);
                    } catch (NumberFormatException ignored) {
                    }
                }
                if (!users.isEmpty()) reactions.put(parts[0], users);
            }
        }
        reactions.values().forEach(users -> users.remove(userId));
        reactions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        reactions.computeIfAbsent(emoji, key -> new java.util.LinkedHashSet<>()).add(userId);
        return reactions.entrySet().stream()
                .map(entry -> entry.getKey() + "=u:" + entry.getValue().stream().map(String::valueOf).reduce((left, right) -> left + "," + right).orElse(""))
                .reduce((left, right) -> left + ";" + right)
                .orElse("");
    }

}
