package com.web.Instagram.controller.api;

import com.web.Instagram.dto.note.NoteResponse;
import com.web.Instagram.service.NoteService;
import com.web.Instagram.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteRestController {

    private final NoteService noteService;
    private final UserService userService;

    @GetMapping("/active")
    public ResponseEntity<List<NoteResponse>> getActiveNotesAlt(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(noteService.getActiveNotes(userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<NoteResponse>> getMyNotes(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(noteService.getUserNotes(userId, userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NoteResponse>> getUserNotes(Principal principal, @PathVariable Long userId) {
        Long currentUserId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(noteService.getUserNotes(userId, currentUserId));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            Principal principal,
            @RequestParam String text,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) Integer expiryHours) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(noteService.createNote(userId, text, color, expiryHours));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> editNote(
            Principal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String text,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) Integer expiryHours) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(noteService.editNote(id, userId, text, color, audience, expiryHours));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(Principal principal, @PathVariable Long id) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        noteService.deleteNote(id, userId);
        return ResponseEntity.ok().build();
    }

}