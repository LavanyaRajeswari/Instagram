package com.web.Instagram.controller.api;

import com.web.Instagram.dto.user.*;
import com.web.Instagram.entity.User;
import com.web.Instagram.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserRestController {

    private final UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(Principal principal) {
        return userService.getCurrentUser(
                principal != null ? principal.getName() : null
        );
    }

    @GetMapping("/{id}")
    public UserResponse getUser(
            @PathVariable Long id
    ) {
        return userService.getUser(id);
    }

    @PostMapping("/register")
    public LoginResponse register(
            @Valid
            @RequestBody RegisterRequest request
    ) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody LoginRequest request
    ) {
        return userService.login(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateRequest request
    ) {
        return userService.updateUser(
                id,
                request
        );
    }

    @PutMapping(value = "/{id}/profile-picture", consumes = "multipart/form-data")
    public UserResponse updateProfilePicture(
            @PathVariable Long id,
            @RequestParam MultipartFile profilePicture
    ) {
        return userService.updateProfilePicture(
                id,
                profilePicture
        );
    }

    @DeleteMapping("/{id}")
    public String deleteUser(
            @PathVariable Long id
    ) {

        userService.deleteUser(id);

        return "User deleted";
    }
}
