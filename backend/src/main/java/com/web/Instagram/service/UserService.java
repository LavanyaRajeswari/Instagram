package com.web.Instagram.service;

import com.web.Instagram.dto.user.*;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.UserRepository;
import com.web.Instagram.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryService cloudinaryService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public UserResponse getUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    public LoginResponse register(RegisterRequest request) {

        if ((request.getEmail() == null || request.getEmail().isBlank())
                &&
                (request.getMobileNumber() == null || request.getMobileNumber().isBlank())) {
            throw new RuntimeException("Email or Mobile Number is required");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (request.getEmail() != null &&
                !request.getEmail().isBlank() &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (request.getMobileNumber() != null &&
                !request.getMobileNumber().isBlank() &&
                userRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new RuntimeException("Mobile number already exists");
        }

        User user = new User();

        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setMobileNumber(request.getMobileNumber());
        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );
        user.setBirthDate(request.getBirthDate());

        User savedUser =
                userRepository.save(user);

        return mapToLoginResponse(savedUser);
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null
                || request.getLogin() == null
                || request.getLogin().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid credentials"
            );
        }

        User user = userRepository
                .findByUsername(request.getLogin())
                .or(() ->
                        userRepository.findByEmail(
                                request.getLogin()))
                .or(() ->
                        userRepository.findByMobileNumber(
                                request.getLogin()))
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Invalid credentials"
                        ));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid credentials"
            );
        }

        return mapToLoginResponse(user);
    }

    public UserResponse getCurrentUser(String username) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Unauthorized"
            );
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Unauthorized"
                        ));

        return mapToResponse(user);
    }

    public UserResponse updateUser(
            Long id,
            UpdateRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setFullName(request.getFullName());
        user.setBio(request.getBio());
        if (request.getProfilePicture() != null && !request.getProfilePicture().isBlank()) {
            if (!isCloudinaryUrl(request.getProfilePicture())) {
                throw new RuntimeException("Profile picture must be uploaded to Cloudinary");
            }
            user.setProfilePicture(request.getProfilePicture());
        }
        user.setIsPrivate(
                request.isPrivate()
        );

        User updatedUser =
                userRepository.save(user);

        return mapToResponse(updatedUser);
    }

    public UserResponse updateProfilePicture(Long id, MultipartFile profilePicture) {
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        validateProfilePicture(profilePicture);

        Map<String, Object> result =
                cloudinaryService.uploadFile(profilePicture, "instagram/profile-pictures");

        user.setProfilePicture(result.get("secure_url").toString());

        User updatedUser =
                userRepository.save(user);

        return mapToResponse(updatedUser);
    }

    public void deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        userRepository.delete(user);
    }

    private UserResponse mapToResponse(
            User user
    ) {

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .profilePicture(
                        user.getProfilePicture()
                )
                .isPrivate(
                        Boolean.TRUE.equals(
                                user.getIsPrivate()
                        )
                )
                .build();
    }

    private LoginResponse mapToLoginResponse(User user) {
        String token =
                jwtService.generateToken(
                        user.getUsername()
                );

        return LoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .token(token)
                .build();
    }

    private void validateProfilePicture(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed for profile pictures");
        }
    }

    private boolean isCloudinaryUrl(String url) {
        return url.startsWith("https://res.cloudinary.com/");
    }
}
