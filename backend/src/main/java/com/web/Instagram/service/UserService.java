package com.web.Instagram.service;

import com.web.Instagram.dto.user.*;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import com.web.Instagram.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryService cloudinaryService;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public UserResponse getUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    public UserResponse register(RegisterRequest request) {

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

        return mapToResponse(savedUser);
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByUsername(request.getLogin())
                .or(() ->
                        userRepository.findByEmail(
                                request.getLogin()))
                .or(() ->
                        userRepository.findByMobileNumber(
                                request.getLogin()))
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException(
                    "Invalid credentials"
            );
        }

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

    public UserResponse updateUser(
            Long id,
            UpdateRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setFullName(request.getFullName());
        user.setBio(request.getBio());
        user.setProfilePicture(
                request.getProfilePicture()
        );
        user.setIsPrivate(
                request.isPrivate()
        );

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

    public UserResponse getCurrentUser() {

        String username = SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        ));

        return mapToResponse(user);
    }

    public UserResponse uploadProfilePicture(MultipartFile file) {
        String username = SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();

        User user = userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        if (user.getProfilePicturePublicId() != null) {
            cloudinaryService.deleteFile(
                    user.getProfilePicturePublicId()
            );
        }

        Map<String, Object> result = cloudinaryService
                        .uploadFile(file);

        user.setProfilePicture(result.get("secure_url").toString());
        user.setProfilePicturePublicId(result.get("public_id").toString());

        userRepository.save(user);
        return mapToResponse(user);
    }

    public UserResponse updateProfile(UpdateProfileRequest request) {
        String username = SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();

        User user = userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));

        user.setBio(request.getBio());
        user.setGender(request.getGender());

        userRepository.save(user);
        return mapToResponse(user);
    }

    private UserResponse mapToResponse(
            User user
    ) {

        long postsCount =
                postRepository.countByUser(user);

        long followersCount =
                followRepository.countByFollowing(user);

        long followingCount =
                followRepository.countByFollower(user);

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .gender(user.getGender())
                .profilePicture(user.getProfilePicture())
                .postsCount(postsCount)
                .followersCount(followersCount)
                .followingCount(followingCount)
                .isPrivate(
                        Boolean.TRUE.equals(
                                user.getIsPrivate()
                        )
                )
                .build();
    }

    public User getAuthenticatedUser() {

        String username =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();

        return userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );
    }

    public UserResponse getUserByUsername(
            String username
    ) {

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        return mapToResponse(user);
    }
}