package com.web.Instagram.controller.api;

import com.web.Instagram.dto.user.*;
import com.web.Instagram.entity.ProfileLink;
import com.web.Instagram.entity.SearchHistory;
import com.web.Instagram.service.TokenBlacklistService;
import com.web.Instagram.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserRestController {

    private final UserService userService;
    private final TokenBlacklistService tokenBlacklistService;

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query.trim()));
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<UserResponse>> getSuggestedUsers(
            Principal principal,
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.getSuggestedUsers(userId, limit));
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

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(Principal principal, @PathVariable Long id) {
        Long currentUserId = userService.getCurrentUser(principal.getName()).getId();
        if (!currentUserId.equals(id)) {
            return ResponseEntity.status(403).build();
        }
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/mutual")
    public ResponseEntity<List<UserResponse>> getMutualFollowers(Principal principal, @PathVariable Long id) {
        Long currentUserId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.getMutualFollowers(currentUserId, id));
    }

    @GetMapping("/{id}/is-following")
    public ResponseEntity<Boolean> isFollowing(Principal principal, @PathVariable Long id) {
        Long currentUserId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.isFollowing(currentUserId, id));
    }

    @PutMapping("/professional")
    public ResponseEntity<UserResponse> setProfessionalAccount(
            Principal principal,
            @RequestParam(required = false) String category) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.setProfessionalAccount(userId, category));
    }

    @PutMapping("/business")
    public ResponseEntity<UserResponse> setBusinessAccount(
            Principal principal,
            @RequestBody(required = false) Map<String, String> body) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        String category = body != null ? body.get("category") : null;
        return ResponseEntity.ok(userService.setBusinessAccount(userId, category));
    }

    @DeleteMapping("/professional")
    public ResponseEntity<UserResponse> removeProfessionalAccount(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.removeProfessionalAccount(userId));
    }

    @PutMapping("/creator")
    public ResponseEntity<UserResponse> setCreatorAccount(
            Principal principal,
            @RequestParam(required = false) String category) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.setCreatorAccount(userId, category));
    }

    @GetMapping("/search-history")
    public ResponseEntity<List<SearchHistory>> getSearchHistory(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.getSearchHistory(userId));
    }

    @DeleteMapping("/search-history")
    public ResponseEntity<Void> clearSearchHistory(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.clearSearchHistory(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/search-history")
    public ResponseEntity<Void> saveSearchHistory(
            Principal principal,
            @RequestBody Map<String, Object> body) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.saveSearchHistory(userId,
                (String) body.get("query"),
                (String) body.get("type"),
                body.get("targetId") != null ? Long.valueOf(body.get("targetId").toString()) : null);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile-links")
    public ResponseEntity<List<ProfileLink>> getProfileLinks(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.getProfileLinks(userId));
    }

    @PostMapping("/profile-links")
    public ResponseEntity<ProfileLink> addProfileLink(
            Principal principal,
            @RequestBody Map<String, String> body) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(userService.addProfileLink(userId, body.get("url"), body.get("title")));
    }

    @DeleteMapping("/profile-links/{linkId}")
    public ResponseEntity<Void> removeProfileLink(Principal principal, @PathVariable Long linkId) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        userService.removeProfileLink(linkId, userId);
        return ResponseEntity.ok().build();
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

    @GetMapping("/login-history")
    public ResponseEntity<List<LoginHistoryResponse>> getLoginHistory(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        List<LoginHistoryResponse> response = userService.getLoginHistory(userId).stream()
                .map(h -> LoginHistoryResponse.builder()
                        .id(h.getId())
                        .ipAddress(h.getIpAddress())
                        .deviceName(h.getDeviceName())
                        .deviceType(h.getDeviceType())
                        .successful(h.isSuccessful())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/suspicious-logins")
    public ResponseEntity<Map<String, Long>> getSuspiciousLoginCount(Principal principal) {
        Long userId = userService.getCurrentUser(principal.getName()).getId();
        return ResponseEntity.ok(Map.of("count", userService.getSuspiciousLoginCount(userId)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);
            tokenBlacklistService.blacklist(token);
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Logged out successfully"
                )
        );
    }
}