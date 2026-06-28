package com.web.Instagram.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.web.Instagram.dto.user.LoginRequest;
import com.web.Instagram.dto.user.LoginResponse;
import com.web.Instagram.dto.user.RegisterRequest;
import com.web.Instagram.entity.LoginHistory;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.LoginHistoryRepository;
import com.web.Instagram.repository.UserRepository;
import com.web.Instagram.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginHistoryRepository loginHistoryRepository;
    private final Map<String, String> refreshTokenStore = new HashMap<>();

    public LoginResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if ((request.getEmail() == null || request.getEmail().isBlank())
                && (request.getMobileNumber() == null || request.getMobileNumber().isBlank())) {
            throw new RuntimeException("Email or Mobile Number is required");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && !request.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new RuntimeException("Invalid email format");
        }

        if (request.getUsername() == null || !request.getUsername().matches("^[a-zA-Z0-9._]{3,30}$")) {
            throw new RuntimeException("Username must be 3-30 characters and contain only letters, numbers, dots and underscores");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6 || request.getPassword().length() > 100) {
            throw new RuntimeException("Password must be between 6 and 100 characters");
        }

        if (!request.getPassword().matches(".*[A-Z].*") || !request.getPassword().matches(".*[a-z].*") || !request.getPassword().matches(".*\\d.*")) {
            throw new RuntimeException("Password must contain at least one uppercase letter, one lowercase letter, and one number");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (request.getMobileNumber() != null && !request.getMobileNumber().isBlank()
                && userRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new RuntimeException("Mobile number already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setMobileNumber(request.getMobileNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setBirthDate(request.getBirthDate());

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getUsername());
        String refreshToken = UUID.randomUUID().toString();
        refreshTokenStore.put(refreshToken, user.getUsername());

        return LoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .token(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        if (request == null || request.getLogin() == null || request.getLogin().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User user = userRepository.findByUsername(request.getLogin())
                .or(() -> userRepository.findByEmail(request.getLogin()))
                .or(() -> userRepository.findByMobileNumber(request.getLogin()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordLoginHistory(user, httpRequest, false);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        user.setLastActiveAt(LocalDateTime.now());
        user.setOnline(true);
        userRepository.save(user);

        recordLoginHistory(user, httpRequest, true);

        String accessToken = jwtService.generateToken(user.getUsername());
        String refreshToken = UUID.randomUUID().toString();
        refreshTokenStore.put(refreshToken, user.getUsername());

        return LoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .token(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public Map<String, String> refreshToken(String refreshToken) {
        String username = refreshTokenStore.get(refreshToken);
        if (username == null) {
            throw new RuntimeException("Invalid refresh token");
        }
        String newAccessToken = jwtService.generateToken(username);
        String newRefreshToken = UUID.randomUUID().toString();
        refreshTokenStore.remove(refreshToken);
        refreshTokenStore.put(newRefreshToken, username);

        Map<String, String> result = new HashMap<>();
        result.put("token", newAccessToken);
        result.put("refreshToken", newRefreshToken);
        return result;
    }

    @Transactional
    public void logout(String username, String refreshToken) {
        if (refreshToken != null) {
            refreshTokenStore.remove(refreshToken);
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setOnline(false);
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void deactivateAccount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountStatus("DEACTIVATED");
        user.setOnline(false);
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void reactivateAccount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountStatus(null);
        userRepository.save(user);
    }

    @Transactional
    public LoginResponse addAccount(String parentUsername, RegisterRequest request) {
        LoginResponse response = register(request, null);
        User parent = userRepository.findByUsername(parentUsername)
                .orElseThrow(() -> new RuntimeException("Parent user not found"));
        User child = userRepository.findByUsername(response.getUsername())
                .orElseThrow(() -> new RuntimeException("Child user not found"));
        child.setParentUser(parent);
        userRepository.save(child);
        return response;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLinkedAccounts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Map<String, Object>> accounts = new ArrayList<>();

        if (user.getParentUser() != null) {
            Map<String, Object> parent = new HashMap<>();
            parent.put("id", user.getParentUser().getId());
            parent.put("username", user.getParentUser().getUsername());
            parent.put("fullName", user.getParentUser().getFullName());
            parent.put("profilePicture", user.getParentUser().getProfilePicture());
            accounts.add(parent);
        }

        for (User child : user.getChildAccounts()) {
            Map<String, Object> childMap = new HashMap<>();
            childMap.put("id", child.getId());
            childMap.put("username", child.getUsername());
            childMap.put("fullName", child.getFullName());
            childMap.put("profilePicture", child.getProfilePicture());
            accounts.add(childMap);
        }

        return accounts;
    }

    private void recordLoginHistory(User user, HttpServletRequest request, boolean successful) {
        try {
            LoginHistory history = LoginHistory.builder()
                    .user(user)
                    .ipAddress(request != null ? request.getRemoteAddr() : "unknown")
                    .deviceName(request != null ? request.getHeader("User-Agent") : "unknown")
                    .deviceType(request != null ? request.getHeader("User-Agent") : "unknown")
                    .successful(successful)
                    .build();
            loginHistoryRepository.save(history);
        } catch (Exception e) {
        }
    }
}
