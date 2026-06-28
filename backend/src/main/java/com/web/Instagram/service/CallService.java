package com.web.Instagram.service;

import com.web.Instagram.entity.Call;
import com.web.Instagram.entity.CallParticipant;
import com.web.Instagram.entity.GroupChat;
import com.web.Instagram.entity.GroupChatMessage;
import com.web.Instagram.entity.Message;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.CallParticipantRepository;
import com.web.Instagram.repository.CallRepository;
import com.web.Instagram.repository.ChatRepository;
import com.web.Instagram.repository.GroupChatMessageRepository;
import com.web.Instagram.repository.GroupChatRepository;
import com.web.Instagram.repository.MessageRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallRepository callRepository;
    private final CallParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final GroupChatRepository groupChatRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final GroupChatMessageRepository groupChatMessageRepository;

    @Transactional
    public Call initiateCall(Long calleeId, String callType) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User callee = userRepository.findById(calleeId)
                .orElseThrow(() -> new RuntimeException("Callee not found"));
        if (caller.getId().equals(callee.getId())) {
            throw new IllegalArgumentException("You cannot call yourself");
        }

        Call call = Call.builder()
                .caller(caller)
                .callee(callee)
                .callType(callType)
                .status("CALLING")
                .build();
        Call saved = callRepository.save(call);
        addParticipant(saved.getId(), caller.getId());
        addParticipant(saved.getId(), callee.getId());
        saveDirectCallMessage(saved, caller, callLabel(saved) + " started");
        return saved;
    }

    @Transactional
    public Call initiateGroupCall(Long groupChatId, String callType) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        GroupChat groupChat = groupChatRepository.findById(groupChatId)
                .orElseThrow(() -> new RuntimeException("Group chat not found"));
        if (groupChat.getMembers().stream().noneMatch(member -> member.getId().equals(caller.getId()))) {
            throw new RuntimeException("Access denied");
        }

        User callee = groupChat.getMembers().stream()
                .filter(m -> !m.getId().equals(caller.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No other members"));

        Call call = Call.builder()
                .caller(caller)
                .callee(callee)
                .callType(callType)
                .status("CALLING")
                .groupCall(true)
                .groupChat(groupChat)
                .build();
        Call saved = callRepository.save(call);
        addParticipant(saved.getId(), caller.getId());
        saveGroupCallMessage(saved, caller, callLabel(saved) + " started in " + groupChat.getName());
        return saved;
    }

    @Transactional
    public Call answerCall(Long callId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        call.setStatus("ANSWERED");
        call.setStartedAt(LocalDateTime.now());
        Call saved = callRepository.save(call);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findByUsername(username).ifPresent(user -> addParticipant(saved.getId(), user.getId()));
        return saved;
    }

    @Transactional
    public Call rejectCall(Long callId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        if (Boolean.TRUE.equals(call.getGroupCall())) {
            User actor = getCurrentUserOr(call.getCallee());
            removeParticipant(callId, actor.getId());
            return call;
        }
        call.setStatus("REJECTED");
        Call saved = callRepository.save(call);
        User actor = getCurrentUserOr(saved.getCallee());
        saveCallSummary(saved, actor, callLabel(saved) + " declined");
        return saved;
    }

    @Transactional
    public Call cancelCall(Long callId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        call.setStatus("CANCELLED");
        Call saved = callRepository.save(call);
        User actor = getCurrentUserOr(saved.getCaller());
        saveCallSummary(saved, actor, callLabel(saved) + " cancelled");
        return saved;
    }

    @Transactional
    public Call endCall(Long callId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        call.setStatus("ENDED");
        call.setEndedAt(LocalDateTime.now());
        if (call.getStartedAt() != null) {
            long seconds = java.time.Duration.between(call.getStartedAt(), call.getEndedAt()).getSeconds();
            call.setDurationSeconds((int) seconds);
        }
        Call saved = callRepository.save(call);
        closeParticipants(saved);
        User actor = getCurrentUserOr(saved.getCaller());
        saveCallSummary(saved, actor, callLabel(saved) + " ended • " + formatDuration(saved.getDurationSeconds()));
        return saved;
    }

    public Long getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Call getCall(Long callId) {
        return callRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
    }

    public Page<Call> getCallHistory(int page, int size) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return callRepository.findByUserId(currentUser.getId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @Transactional
    public void addParticipant(Long callId, Long userId) {
        if (!participantRepository.existsByCallIdAndUserId(callId, userId)) {
            Call call = callRepository.findById(callId)
                    .orElseThrow(() -> new RuntimeException("Call not found"));
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            participantRepository.save(CallParticipant.builder()
                    .call(call).user(user).build());
        }
    }

    @Transactional
    public void removeParticipant(Long callId, Long userId) {
        participantRepository.deleteByCallIdAndUserId(callId, userId);
    }

    public List<User> getParticipants(Long callId) {
        return participantRepository.findByCallId(callId).stream()
                .map(CallParticipant::getUser)
                .toList();
    }

    public int getParticipantCount(Long callId) {
        return participantRepository.findByCallId(callId).size();
    }

    private void saveCallSummary(Call call, User actor, String content) {
        if (Boolean.TRUE.equals(call.getGroupCall())) {
            saveGroupCallMessage(call, actor, content + " • " + participantSummary(call));
        } else {
            saveDirectCallMessage(call, actor, content);
        }
    }

    private void closeParticipants(Call call) {
        LocalDateTime endedAt = call.getEndedAt() != null ? call.getEndedAt() : LocalDateTime.now();
        List<CallParticipant> participants = participantRepository.findByCallId(call.getId());
        for (CallParticipant participant : participants) {
            if (participant.getLeftAt() == null) {
                participant.setLeftAt(endedAt);
                if (participant.getJoinedAt() != null) {
                    long seconds = java.time.Duration.between(participant.getJoinedAt(), endedAt).getSeconds();
                    participant.setDurationSeconds((int) Math.max(seconds, 0));
                }
            }
        }
        participantRepository.saveAll(participants);
    }

    private String participantSummary(Call call) {
        List<CallParticipant> participants = participantRepository.findByCallId(call.getId());
        String joined = participants.size() + " joined";
        String participantNames = participants.stream()
                .map(participant -> participant.getUser().getUsername())
                .collect(java.util.stream.Collectors.joining(", "));
        return participantNames.isBlank() ? joined : joined + " • " + participantNames;
    }

    private void saveDirectCallMessage(Call call, User actor, String content) {
        chatRepository.findExistingChat(call.getCaller().getId(), call.getCallee().getId()).ifPresent(chat -> {
            Message message = new Message();
            message.setChat(chat);
            message.setSender(actor);
            message.setContent(content);
            message.setMessageType("SYSTEM");
            Message saved = messageRepository.save(message);
            chat.setLastMessage(content);
            chat.setLastMessageAt(saved.getCreatedAt());
            chatRepository.save(chat);
        });
    }

    private void saveGroupCallMessage(Call call, User actor, String content) {
        if (call.getGroupChat() == null) return;
        GroupChatMessage message = GroupChatMessage.builder()
                .groupChat(call.getGroupChat())
                .sender(actor)
                .content(content)
                .messageType("SYSTEM")
                .build();
        GroupChatMessage saved = groupChatMessageRepository.save(message);
        GroupChat groupChat = call.getGroupChat();
        groupChat.setLastMessage(content);
        groupChat.setLastMessageAt(saved.getCreatedAt());
        groupChatRepository.save(groupChat);
    }

    private String callLabel(Call call) {
        return "VIDEO".equalsIgnoreCase(call.getCallType()) ? "Video call" : "Audio call";
    }

    private String formatDuration(Integer secondsValue) {
        int seconds = secondsValue != null ? secondsValue : 0;
        int minutes = seconds / 60;
        int remainingSeconds = seconds % 60;
        return String.format("%02d:%02d", minutes, remainingSeconds);
    }

    private User getCurrentUserOr(User fallback) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByUsername(username).orElse(fallback);
        } catch (Exception _ignored) {
            return fallback;
        }
    }
}
