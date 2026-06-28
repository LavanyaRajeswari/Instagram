package com.web.Instagram.service;

import com.web.Instagram.dto.chat.MessageDto;
import com.web.Instagram.dto.chat.SendMessageRequest;
import com.web.Instagram.entity.Chat;
import com.web.Instagram.entity.Message;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.ChatRepository;
import com.web.Instagram.entity.MessageReaction;
import com.web.Instagram.repository.MessageReactionRepository;
import com.web.Instagram.repository.MessageRepository;
import com.web.Instagram.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageReactionRepository messageReactionRepository;

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

    public Page<MessageDto> getSharedMedia(Long chatId, int page, int size) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat);

        Page<Message> messages = messageRepository.findByChatIdAndMessageTypeIn(
                chatId,
                List.of("IMAGE", "VIDEO", "FILE"),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return messages.map(this::convert);
    }

    public Page<MessageDto> getSharedLinks(Long chatId, int page, int size) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat);

        Page<Message> messages = messageRepository.findByChatIdAndMessageTypeIn(
                chatId,
                List.of("LINK"),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
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
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }

    @Transactional
    public void reactToMessage(Long messageId, Long userId, String reaction) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        messageReactionRepository.findByMessageIdAndUserId(messageId, userId)
                .ifPresent(messageReactionRepository::delete);

        MessageReaction messageReaction = MessageReaction.builder()
                .message(message)
                .user(user)
                .reaction(reaction)
                .build();
        messageReactionRepository.save(messageReaction);
    }

    @Transactional
    public void removeReaction(Long messageId, Long userId) {
        messageReactionRepository.deleteByMessageIdAndUserId(messageId, userId);
    }

    public List<MessageReaction> getReactions(Long messageId) {
        return messageReactionRepository.findByMessageId(messageId);
    }

    public Page<MessageDto> searchMessages(Long chatId, String query, Pageable pageable) {
        return messageRepository.searchMessages(chatId, query, pageable).map(this::convert);
    }

    public Page<MessageDto> getForwardedMessages(Long chatId, Pageable pageable) {
        return messageRepository.findForwardedMessages(chatId, pageable).map(this::convert);
    }

    public Page<MessageDto> getMediaMessages(Long chatId, Pageable pageable) {
        return messageRepository.findMediaMessages(chatId, pageable).map(this::convert);
    }

    @Transactional
    public void unsendMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        message.setContent("[Message unsent]");
        message.setDeleted(true);
        messageRepository.save(message);
    }
}
