package com.web.Instagram.service;

import com.web.Instagram.dto.chat.GroupMessageDto;
import com.web.Instagram.entity.GroupChat;
import com.web.Instagram.entity.GroupChatAdmin;
import com.web.Instagram.entity.GroupChatMessage;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.GroupChatAdminRepository;
import com.web.Instagram.repository.GroupChatMessageRepository;
import com.web.Instagram.repository.GroupChatRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GroupChatService {

    private final GroupChatRepository groupChatRepository;
    private final GroupChatMessageRepository groupChatMessageRepository;
    private final GroupChatAdminRepository groupChatAdminRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public GroupChat createGroup(String name, String description, List<Long> memberIds, String profilePicture) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> members = new ArrayList<>(userRepository.findAllById(memberIds));
        if (members.stream().noneMatch(m -> m.getId().equals(creator.getId()))) {
            members.add(creator);
        }

        GroupChat groupChat = GroupChat.builder()
                .name(name)
                .description(description)
                .profilePicture(profilePicture)
                .createdBy(creator)
                .members(members)
                .build();
        groupChat = groupChatRepository.save(groupChat);
        groupChatAdminRepository.save(GroupChatAdmin.builder()
            .groupChat(groupChat).user(creator).build());
        saveSystemMessage(groupChat, creator, creator.getUsername() + " created the group");
        members.stream()
                .filter(member -> !member.getId().equals(creator.getId()))
                .forEach(member -> notificationService.createNotification(
                        member.getId(),
                        creator.getId(),
                        "GROUP_ADDED",
                        null,
                        null,
                        "You were added to " + name
                ));
        return groupChat;
    }

    public List<GroupChat> getUserGroups() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return groupChatRepository.findByMembersIdOrderByLastMessageAtDesc(currentUser.getId());
    }

    public GroupChat getGroup(Long groupChatId) {
        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));
        validateMember(groupChat);
        return groupChat;
    }

    @Transactional
    public void addMember(Long groupChatId, Long userId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));

        if (!groupChat.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only group creator can add members");
        }

        User newMember = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (groupChat.getMembers().stream().anyMatch(m -> m.getId().equals(userId))) {
            throw new RuntimeException("User is already a member");
        }

        groupChat.getMembers().add(newMember);
        groupChatRepository.save(groupChat);
        saveSystemMessage(groupChat, currentUser, currentUser.getUsername() + " added " + newMember.getUsername());
        notificationService.createNotification(newMember.getId(), currentUser.getId(), "GROUP_ADDED", null, null,
                "You were added to " + groupChat.getName());
    }

    @Transactional
    public void removeMember(Long groupChatId, Long userId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));

        if (!groupChat.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only group creator can remove members");
        }

        User removed = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        groupChat.getMembers().removeIf(m -> m.getId().equals(userId));
        groupChatRepository.save(groupChat);
        saveSystemMessage(groupChat, currentUser, removed.getUsername() + " was removed");
    }

    @Transactional
    public void leaveGroup(Long groupChatId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));

        groupChat.getMembers().removeIf(m -> m.getId().equals(currentUser.getId()));
        groupChatRepository.save(groupChat);
        saveSystemMessage(groupChat, currentUser, currentUser.getUsername() + " left the group");
    }

    @Transactional
    public GroupMessageDto sendMessage(Long groupChatId, String content, String messageType,
                                         String mediaUrl, String mediaType, Long replyToId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));
        validateMember(groupChat, sender);

        GroupChatMessage replyTo = replyToId != null ?
                groupChatMessageRepository.findById(replyToId).orElse(null) : null;

        GroupChatMessage msg = GroupChatMessage.builder()
                .groupChat(groupChat)
                .sender(sender)
                .content(content)
                .messageType(messageType != null ? messageType : "TEXT")
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .replyTo(replyTo)
                .build();

        msg = groupChatMessageRepository.save(msg);
        groupChat.setLastMessage(content != null ? content : "[Media]");
        groupChat.setLastMessageAt(msg.getCreatedAt());
        groupChatRepository.save(groupChat);
        return toDto(msg);
    }

    public Page<GroupMessageDto> getMessages(Long groupChatId, int page, int size) {
        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));
        validateMember(groupChat);
        return groupChatMessageRepository.findByGroupChatId(groupChatId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())).map(this::toDto);
    }

    @Transactional
    public GroupMessageDto editMessage(Long groupChatId, Long messageId, String content) {
        User currentUser = getCurrentUser();
        GroupChatMessage message = groupChatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getGroupChat().getId().equals(groupChatId)) {
            throw new RuntimeException("Message does not belong to this group");
        }
        validateMember(message.getGroupChat(), currentUser);
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }
        message.setContent(content);
        return toDto(groupChatMessageRepository.save(message));
    }

    @Transactional
    public GroupMessageDto deleteMessage(Long groupChatId, Long messageId) {
        User currentUser = getCurrentUser();
        GroupChatMessage message = groupChatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getGroupChat().getId().equals(groupChatId)) {
            throw new RuntimeException("Message does not belong to this group");
        }
        validateMember(message.getGroupChat(), currentUser);
        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized");
        }
        message.setContent("[Message deleted]");
        message.setDeleted(true);
        return toDto(groupChatMessageRepository.save(message));
    }

    public boolean isAdmin(Long groupChatId, Long userId) {
        return groupChatAdminRepository.existsByGroupChatIdAndUserId(groupChatId, userId);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateMember(GroupChat groupChat) {
        validateMember(groupChat, getCurrentUser());
    }

    private void validateMember(GroupChat groupChat, User currentUser) {
        boolean member = groupChat.getMembers().stream()
                .anyMatch(user -> user.getId().equals(currentUser.getId()));
        if (!member) {
            throw new RuntimeException("Access denied");
        }
    }

    private GroupChatMessage saveSystemMessage(GroupChat groupChat, User actor, String content) {
        GroupChatMessage message = GroupChatMessage.builder()
                .groupChat(groupChat)
                .sender(actor)
                .content(content)
                .messageType("SYSTEM")
                .build();
        GroupChatMessage saved = groupChatMessageRepository.save(message);
        groupChat.setLastMessage(content);
        groupChat.setLastMessageAt(saved.getCreatedAt());
        groupChatRepository.save(groupChat);
        return saved;
    }

    private GroupMessageDto toDto(GroupChatMessage message) {
        User sender = message.getSender();
        return GroupMessageDto.builder()
                .id(message.getId())
                .groupId(message.getGroupChat().getId())
                .senderId(sender != null ? sender.getId() : null)
                .senderUsername(sender != null ? sender.getUsername() : null)
                .senderFullName(sender != null ? sender.getFullName() : null)
                .senderProfilePicture(sender != null ? sender.getProfilePicture() : null)
                .content(message.getContent())
                .messageType(message.getMessageType())
                .mediaUrl(message.getMediaUrl())
                .mediaType(message.getMediaType())
                .replyToId(message.getReplyTo() != null ? message.getReplyTo().getId() : null)
                .seen(message.getSeen())
                .deleted(message.getDeleted())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
