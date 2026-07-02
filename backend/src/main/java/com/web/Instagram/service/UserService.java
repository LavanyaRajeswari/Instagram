package com.web.Instagram.service;

import com.web.Instagram.dto.user.LoginRequest;
import com.web.Instagram.dto.user.LoginResponse;
import com.web.Instagram.dto.user.RegisterRequest;
import com.web.Instagram.dto.user.SearchHistoryRequest;
import com.web.Instagram.dto.user.SearchHistoryResponse;
import com.web.Instagram.dto.user.UpdateRequest;
import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.entity.SearchHistory;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.NotificationRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.SearchHistoryRepository;
import com.web.Instagram.repository.UserRepository;
import com.web.Instagram.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryService cloudinaryService;
    private final PostService postService;
    private final StoryService storyService;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final NotificationRepository notificationRepository;
    private final SearchHistoryRepository searchHistoryRepository;

    public List<UserResponse> getAllUsers(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return userRepository.findAll(PageRequest.of(0, safeLimit))
                .stream().map(this::mapToResponse).toList();
    }

    public List<UserResponse> searchUsers(String query) {
        return userRepository.searchUsers(query).stream().map(this::mapToResponse).toList();
    }

    @Cacheable(cacheNames = "userProfiles", key = "#id")
    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (isDeleted(user)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return mapToResponse(user);
    }

    public LoginResponse register(RegisterRequest request) {
        if ((request.getEmail() == null || request.getEmail().isBlank())
                && (request.getMobileNumber() == null || request.getMobileNumber().isBlank())) {
            throw new RuntimeException("Email or Mobile Number is required");
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

        User savedUser = userRepository.save(user);
        return mapToLoginResponse(savedUser);
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.getLogin() == null || request.getLogin().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User user = userRepository.findByUsername(request.getLogin())
                .or(() -> userRepository.findByEmail(request.getLogin()))
                .or(() -> userRepository.findByMobileNumber(request.getLogin()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return mapToLoginResponse(user);
    }

    @Cacheable(cacheNames = "userProfiles", key = "'username:' + #username", unless = "#username == null")
    public UserResponse getCurrentUser(String username) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
        if (isDeleted(user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        return mapToResponse(user);
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "feed"}, allEntries = true)
    public UserResponse updateUser(Long id, UpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getWebsite() != null) user.setWebsite(request.getWebsite());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getProfilePicture() != null && !request.getProfilePicture().isBlank()) {
            if (!isCloudinaryUrl(request.getProfilePicture())) {
                throw new RuntimeException("Profile picture must be uploaded to Cloudinary");
            }
            user.setProfilePicture(request.getProfilePicture());
        }
        if (request.getIsPrivate() != null) user.setIsPrivate(request.getIsPrivate());

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @CacheEvict(cacheNames = {"userProfiles", "feed"}, allEntries = true)
    public UserResponse updateProfilePicture(Long id, MultipartFile profilePicture) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateProfilePicture(profilePicture);

        Map<String, Object> result = cloudinaryService.uploadFile(profilePicture, "instagram/profile-pictures");
        user.setProfilePicture(result.get("secure_url").toString());
        User updatedUser = userRepository.save(user);

        return mapToResponse(updatedUser);
    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .bio(user.getBio())
                .gender(user.getGender())
                .profilePicture(user.getProfilePicture())
                .website(user.getWebsite())
                .isPrivate(Boolean.TRUE.equals(user.getIsPrivate()))
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .pronouns(user.getPronouns())
                .postsCount(postRepository.countByUserId(user.getId()))
                .followersCount(followRepository.countByFollowingId(user.getId()))
                .followingCount(followRepository.countByFollowerId(user.getId()))
                .lastActiveAt(user.getLastActiveAt())
                .accountStatus(user.getAccountStatus())
                .commentsDisabled(Boolean.TRUE.equals(user.getCommentsDisabled()))
                .hideLikeCount(Boolean.TRUE.equals(user.getHideLikeCount()))
                .activityStatus(Boolean.TRUE.equals(user.getActivityStatus()))
                .readReceipts(Boolean.TRUE.equals(user.getReadReceipts()))
                .sensitiveContentFilter(user.getSensitiveContentFilter() != null ? user.getSensitiveContentFilter() : "STANDARD")
                .allowReelDownloads(Boolean.TRUE.equals(user.getAllowReelDownloads()))
                .theme(user.getTheme() != null ? user.getTheme() : "SYSTEM")
                .storyRepliesEnabled(Boolean.TRUE.equals(user.getStoryRepliesEnabled()))
                .storyMentionsEnabled(Boolean.TRUE.equals(user.getStoryMentionsEnabled()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private boolean isDeleted(User user) {
        return user != null && "DELETED".equalsIgnoreCase(user.getAccountStatus());
    }

    private LoginResponse mapToLoginResponse(User user) {
        String token = jwtService.generateToken(user.getUsername());
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

    public List<UserResponse> getSuggestedUsers(Long userId, int limit) {
        return userRepository.findSuggestedUsers(userId,
            PageRequest.of(0, limit))
            .stream().map(this::mapToResponse).toList();
    }

    private boolean isCloudinaryUrl(String url) {
        return url.startsWith("https://res.cloudinary.com/");
    }

    @Transactional
    public void removeFollower(Long userId, Long followerId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, userId);
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "postById", "feed", "reels"}, allEntries = true)
    public void setPrivacySetting(Long userId, String setting, boolean value) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        switch (setting) {
            case "isPrivate", "privateAccount" -> user.setIsPrivate(value);
            case "activityStatus" -> user.setActivityStatus(value);
            case "readReceipts" -> user.setReadReceipts(value);
            case "commentsDisabled" -> user.setCommentsDisabled(value);
            case "hideLikeCount" -> user.setHideLikeCount(value);
            case "storyRepliesEnabled" -> user.setStoryRepliesEnabled(value);
            case "storyMentionsEnabled" -> user.setStoryMentionsEnabled(value);
            case "allowReelDownloads" -> user.setAllowReelDownloads(value);
            default -> throw new RuntimeException("Unknown setting: " + setting);
        }
        userRepository.save(user);
    }

    public boolean canViewUserPosts(String requesterUsername, Long targetUserId) {
        User target = userRepository.findById(targetUserId).orElse(null);
        if (target == null) return false;
        if (!Boolean.TRUE.equals(target.getIsPrivate())) return true;
        if (requesterUsername == null) return false;
        User requester = userRepository.findByUsername(requesterUsername).orElse(null);
        if (requester == null) return false;
        if (requester.getId().equals(targetUserId)) return true;
        return followRepository.existsByFollowerIdAndFollowingId(requester.getId(), targetUserId);
    }

    public boolean canViewProfile(String requesterUsername, Long targetUserId) {
        return canViewUserPosts(requesterUsername, targetUserId);
    }

    @Transactional
    public void saveSearchHistory(Long userId, SearchHistoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        SearchHistory history = SearchHistory.builder()
                .user(user)
                .query(request.getQuery())
                .type(request.getType())
                .targetId(request.getTargetId())
                .build();
        searchHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<SearchHistoryResponse> getSearchHistory(Long userId) {
        return searchHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(h -> SearchHistoryResponse.builder()
                        .id(h.getId())
                        .query(h.getQuery())
                        .type(h.getType())
                        .targetId(h.getTargetId())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void clearSearchHistory(Long userId) {
        searchHistoryRepository.deleteByUserId(userId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "postById", "feed", "reels"}, allEntries = true)
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Long> postIds = postRepository.findIdsByUserId(userId);
        postIds.forEach(postId -> postService.deletePost(postId, userId));
        storyService.deleteStoriesAndHighlightsForUser(userId);
        String deletedUsername = "deleted_" + user.getId();
        user.setUsername(deletedUsername.length() <= 30 ? deletedUsername : deletedUsername.substring(0, 30));
        user.setFullName("Deleted User");
        user.setEmail(null);
        user.setMobileNumber(null);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setBio(null);
        user.setGender(null);
        user.setProfilePicture(null);
        user.setWebsite(null);
        user.setPronouns(null);
        user.setIsPrivate(true);
        user.setOnline(false);
        user.setAccountStatus("DELETED");
        userRepository.save(user);
        followRepository.deleteByFollowerId(userId);
        followRepository.deleteByFollowingId(userId);
        notificationRepository.deleteBySenderId(userId);
        notificationRepository.deleteByRecipientId(userId);
        searchHistoryRepository.deleteByUserId(userId);
    }
}
