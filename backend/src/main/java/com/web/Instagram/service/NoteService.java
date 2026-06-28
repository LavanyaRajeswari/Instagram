package com.web.Instagram.service;

import com.web.Instagram.dto.note.NoteResponse;
import com.web.Instagram.entity.*;
import com.web.Instagram.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    public List<NoteResponse> getActiveNotes(Long currentUserId) {
        User currentUser = getUserOrThrow(currentUserId);
        List<String> visibleAudiences = List.of("PUBLIC", "FOLLOWERS", "MUTUALS");
        List<Note> notes = noteRepository.findByExpiresAtAfterAndAudienceInOrderByCreatedAtDesc(
            LocalDateTime.now(), visibleAudiences);
        return notes.stream()
            .filter(n -> canViewNote(currentUser, n))
            .map(n -> toResponse(n, currentUserId))
            .toList();
    }

    public List<NoteResponse> getUserNotes(Long userId, Long currentUserId) {
        List<String> visibleAudiences = List.of("PUBLIC", "FOLLOWERS", "MUTUALS");
        return noteRepository.findByUserIdAndExpiresAtAfterAndAudienceInOrderByCreatedAtDesc(
            userId, LocalDateTime.now(), visibleAudiences).stream()
            .filter(n -> canViewNote(getUserOrThrow(currentUserId), n))
            .map(n -> toResponse(n, currentUserId))
            .toList();
    }

    @Transactional
    public NoteResponse createNote(Long userId, String text, String color, Integer expiryHours) {
        User user = getUserOrThrow(userId);
        if (expiryHours == null) expiryHours = 24;
        List<Note> existingNotes = noteRepository.findByUserId(userId);
        for (Note existingNote : existingNotes) {
            noteRepository.delete(existingNote);
        }
        Note note = Note.builder()
            .user(user).text(text).color(color)
            .audience("FOLLOWERS")
            .expiresAt(LocalDateTime.now().plusHours(expiryHours))
            .build();
        return toResponse(noteRepository.save(note), userId);
    }

    @Transactional
    public NoteResponse editNote(Long noteId, String text, String color, String audience, Integer expiryHours) {
        Note note = noteRepository.findById(noteId)
            .orElseThrow(() -> new RuntimeException("Note not found"));
        if (text != null) note.setText(text);
        if (color != null) note.setColor(color);
        if (audience != null) note.setAudience(audience);
        if (expiryHours != null) note.setExpiresAt(LocalDateTime.now().plusHours(expiryHours));
        return toResponse(noteRepository.save(note), note.getUser().getId());
    }

    @Transactional
    public void deleteNote(Long noteId) {
        noteRepository.deleteById(noteId);
    }

    private boolean canViewNote(User currentUser, Note note) {
        if (note.getUser().getId().equals(currentUser.getId())) return true;
        return followRepository.existsByFollowerIdAndFollowingId(
            note.getUser().getId(), currentUser.getId());
    }

    private NoteResponse toResponse(Note note, Long currentUserId) {
        User user = note.getUser();
        return NoteResponse.builder()
            .id(note.getId()).text(note.getText()).color(note.getColor())
            .audience(note.getAudience()).expiresAt(note.getExpiresAt())
            .createdAt(note.getCreatedAt())
            .likeCount(0)
            .replyCount(0)
            .likedByCurrentUser(false)
            .user(NoteResponse.NoteUser.builder()
                .id(user.getId()).username(user.getUsername())
                .fullName(user.getFullName()).profilePicture(user.getProfilePicture()).build())
            .build();
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}