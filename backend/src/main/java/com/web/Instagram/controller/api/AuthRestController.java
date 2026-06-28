package com.web.Instagram.controller.api;

import com.web.Instagram.dto.user.LoginResponse;
import com.web.Instagram.dto.user.LoginRequest;
import com.web.Instagram.dto.user.RegisterRequest;
import com.web.Instagram.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthRestController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Principal principal, @RequestBody(required = false) Map<String, String> body) {
        String refreshToken = body != null ? body.get("refreshToken") : null;
        authService.logout(principal.getName(), refreshToken);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/deactivate")
    public ResponseEntity<Void> deactivateAccount(Principal principal) {
        authService.deactivateAccount(principal.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reactivate")
    public ResponseEntity<Void> reactivateAccount(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (username == null) return ResponseEntity.badRequest().build();
        authService.reactivateAccount(username);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/add-account")
    public ResponseEntity<LoginResponse> addAccount(
            Principal principal,
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.addAccount(principal.getName(), request));
    }

    @GetMapping("/linked-accounts")
    public ResponseEntity<List<Map<String, Object>>> getLinkedAccounts(Principal principal) {
        return ResponseEntity.ok(authService.getLinkedAccounts(principal.getName()));
    }
}