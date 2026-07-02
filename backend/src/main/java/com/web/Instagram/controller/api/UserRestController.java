package com.web.Instagram.controller.api;

import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.web.Instagram.dto.user.LoginRequest;
import com.web.Instagram.dto.user.LoginResponse;
import com.web.Instagram.dto.user.RegisterRequest;
import com.web.Instagram.dto.user.SearchHistoryRequest;
import com.web.Instagram.dto.user.SearchHistoryResponse;
import com.web.Instagram.dto.user.UpdateRequest;
import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserRestController {

    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query.trim()));
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<UserResponse>> getSuggestedUsers(
            Principal principal,
            @RequestParam(defaultValue = "20") int limit) {
        if (principal == null) {
            return ResponseEntity.ok(userService.getAllUsers(limit));
        }
        try {
            Long userId = userService.getCurrentUser(principal.getName()).getId();
            return ResponseEntity.ok(userService.getSuggestedUsers(userId, limit));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(userService.getAllUsers(limit));
        }
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(userService.getAllUsers(limit));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(userService.getCurrentUser(
                principal != null ? principal.getName() : null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateRequest request) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @PutMapping(value = "/profile-picture", consumes = "multipart/form-data")
    public ResponseEntity<UserResponse> updateProfilePicture(
            Principal principal,
            @RequestParam MultipartFile profilePicture) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.updateProfilePicture(userId, profilePicture));
    }

    @GetMapping("/{id}/is-following")
    public ResponseEntity<Boolean> isFollowing(Principal principal, @PathVariable Long id) {
        Long currentUserId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.isFollowing(currentUserId, id));
    }

    @PutMapping("/privacy/{setting}")
    public ResponseEntity<Void> setPrivacySetting(
            Principal principal,
            @PathVariable String setting,
            @RequestParam boolean value) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.setPrivacySetting(userId, setting, value);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search-history")
    public ResponseEntity<List<SearchHistoryResponse>> getSearchHistory(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.getSearchHistory(userId));
    }

    @PostMapping("/search-history")
    public ResponseEntity<Void> saveSearchHistory(Principal principal, @RequestBody SearchHistoryRequest request) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.saveSearchHistory(userId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/search-history")
    public ResponseEntity<Void> clearSearchHistory(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.clearSearchHistory(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.deleteAccount(userId);
        return ResponseEntity.ok().build();
    }

}
