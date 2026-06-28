package com.web.Instagram.service;

import com.web.Instagram.dto.chat.ChatDto;
import com.web.Instagram.entity.Chat;
import com.web.Instagram.entity.ChatSetting;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.ChatRepository;
import com.web.Instagram.repository.ChatSettingRepository;
import com.web.Instagram.repository.MessageRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatSettingRepository chatSettingRepository;

    public ChatDto startChat(Long targetUserId) {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User currentUser = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Chat> existing = chatRepository.findExistingChat(
                currentUser.getId(),
                targetUserId
        );

        if (existing.isPresent()) {
            return convert(existing.get(), currentUser.getId());
        }

        User targetUser = userRepository
                .findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Chat chat = new Chat();
        chat.setUserOne(currentUser);
        chat.setUserTwo(targetUser);

        chat = chatRepository.save(chat);

        return convert(chat, currentUser.getId());
    }

    public List<ChatDto> getChats() {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User currentUser = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<Long, ChatDto> chatsByOtherUser = new LinkedHashMap<>();
        chatRepository.findByUserIdAndArchivedFalse(currentUser.getId())
                .stream()
                .map(chat -> convert(chat, currentUser.getId()))
                .forEach(chat -> chatsByOtherUser.putIfAbsent(chat.getOtherUserId(), chat));
        return List.copyOf(chatsByOtherUser.values());
    }

    @Transactional
    public void deleteChat(Long chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat, currentUser.getId());
        chatRepository.delete(chat);
    }

    @Transactional
    public void muteChat(Long chatId, LocalDateTime muteUntil) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat, currentUser.getId());
        chat.setMuted(true);
        chat.setMuteUntil(muteUntil);
        chatRepository.save(chat);
    }

    @Transactional
    public void unmuteChat(Long chatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat, currentUser.getId());
        chat.setMuted(false);
        chat.setMuteUntil(null);
        chatRepository.save(chat);
    }

    @Transactional
    public void setNickname(Long chatId, String nickname) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));
        validateParticipant(chat, currentUser.getId());
        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(currentUser.getId(), chatId)
                .orElseGet(() -> {
                    ChatSetting s = new ChatSetting();
                    s.setUser(currentUser);
                    s.setChat(chat);
                    return s;
                });
        setting.setNickname(nickname);
        chatSettingRepository.save(setting);
    }

    private void validateParticipant(Chat chat, Long userId) {
        boolean participant = chat.getUserOne().getId().equals(userId) || chat.getUserTwo().getId().equals(userId);
        if (!participant) {
            throw new RuntimeException("Access denied");
        }
    }

    private ChatDto convert(Chat chat, Long currentUserId) {

        User otherUser;
        if (chat.getUserOne().getId().equals(currentUserId)) {
            otherUser = chat.getUserTwo();
        } else {
            otherUser = chat.getUserOne();
        }

        long unreadCount = messageRepository.countByChatIdAndSeenFalseAndSenderIdNot(chat.getId(), currentUserId);

        ChatDto dto = new ChatDto();
        dto.setId(chat.getId());
        dto.setOtherUserId(otherUser.getId());
        dto.setUsername(otherUser.getUsername());
        dto.setFullName(otherUser.getFullName());
        dto.setProfilePicture(otherUser.getProfilePicture());
        dto.setLastMessage(chat.getLastMessage() != null ? chat.getLastMessage() : "");
        dto.setLastMessageAt(chat.getLastMessageAt());
        dto.setLastSeen(otherUser.getLastActiveAt());
        dto.setUnreadCount(unreadCount);
        dto.setOnline(otherUser.isOnline());
        dto.setPinned(chat.isPinned());
        dto.setArchived(chat.isArchived());
        dto.setMuted(chat.isMuted());
        dto.setMuteUntil(chat.getMuteUntil());
        dto.setVanishMode(chat.getVanishMode());

        ChatSetting setting = chatSettingRepository.findByUserIdAndChatId(currentUserId, chat.getId()).orElse(null);
        if (setting != null) {
            dto.setNickname(setting.getNickname());
            dto.setTheme(setting.getTheme());
            dto.setWallpaper(setting.getWallpaper());
        }

        return dto;
    }
}
