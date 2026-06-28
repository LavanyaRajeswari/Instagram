package com.web.Instagram.service;

import com.web.Instagram.dto.user.LoginRequest;
import com.web.Instagram.dto.user.LoginResponse;
import com.web.Instagram.dto.user.RegisterRequest;
import com.web.Instagram.dto.user.UpdateRequest;
import com.web.Instagram.dto.user.UserResponse;
import com.web.Instagram.entity.LoginHistory;
import com.web.Instagram.entity.ProfileLink;
import com.web.Instagram.entity.SearchHistory;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.LoginHistoryRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.ProfileLinkRepository;
import com.web.Instagram.repository.SearchHistoryRepository;
import com.web.Instagram.repository.UserRepository;
import com.web.Instagram.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final ProfileLinkRepository profileLinkRepository;
    private final LoginHistoryRepository loginHistoryRepository;

    public List<UserResponse> getAllUsers(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return userRepository.findAll(org.springframework.data.domain.PageRequest.of(0, safeLimit))
                .stream().map(this::mapToResponse).toList();
    }

    public List<UserResponse> searchUsers(String query) {
        return userRepository.searchUsers(query).stream().map(this::mapToResponse).toList();
    }

    @Cacheable(cacheNames = "userProfiles", key = "#id")
    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
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

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @CacheEvict(cacheNames = {"userProfiles", "feed"}, allEntries = true)
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
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
                .isProfessional(Boolean.TRUE.equals(user.getIsProfessional()))
                .isBusiness(Boolean.TRUE.equals(user.getIsBusiness()))
                .isCreator(Boolean.TRUE.equals(user.getIsCreator()))
                .category(user.getCategory())
                .role(user.getRole() != null ? user.getRole() : "USER")
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
            org.springframework.data.domain.PageRequest.of(0, limit))
            .stream().map(this::mapToResponse).toList();
    }

    private boolean isCloudinaryUrl(String url) {
        return url.startsWith("https://res.cloudinary.com/");
    }

    public List<UserResponse> getMutualFollowers(Long currentUserId, Long targetUserId) {
        List<Long> currentUserFollowingIds = followRepository.findByFollowerId(currentUserId)
                .stream().map(f -> f.getFollowing().getId()).toList();
        List<Long> targetUserFollowerIds = followRepository.findByFollowingId(targetUserId)
                .stream().map(f -> f.getFollower().getId()).toList();

        List<Long> mutualIds = currentUserFollowingIds.stream()
                .filter(targetUserFollowerIds::contains)
                .toList();

        return userRepository.findAllById(mutualIds).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void removeFollower(Long userId, Long followerId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, userId);
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    public UserResponse setProfessionalAccount(Long userId, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsProfessional(true);
        user.setIsBusiness(false);
        if (category != null) user.setCategory(category);
        return mapToResponse(userRepository.save(user));
    }

    public UserResponse setBusinessAccount(Long userId, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsBusiness(true);
        user.setIsProfessional(false);
        if (category != null) user.setCategory(category);
        return mapToResponse(userRepository.save(user));
    }

    public UserResponse removeProfessionalAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsProfessional(false);
        user.setIsBusiness(false);
        user.setIsCreator(false);
        user.setCategory(null);
        return mapToResponse(userRepository.save(user));
    }

    public UserResponse setCreatorAccount(Long userId, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsCreator(true);
        user.setIsProfessional(false);
        user.setIsBusiness(false);
        if (category != null) user.setCategory(category);
        return mapToResponse(userRepository.save(user));
    }

    public List<SearchHistory> getSearchHistory(Long userId) {
        return searchHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void saveSearchHistory(Long userId, String query, String type, Long targetId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        SearchHistory history = SearchHistory.builder()
                .user(user)
                .query(query)
                .type(type)
                .targetId(targetId)
                .build();
        searchHistoryRepository.save(history);
    }

    @Transactional
    public void clearSearchHistory(Long userId) {
        searchHistoryRepository.deleteByUserId(userId);
    }

    public List<ProfileLink> getProfileLinks(Long userId) {
        return profileLinkRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    @Transactional
    public ProfileLink addProfileLink(Long userId, String url, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ProfileLink link = ProfileLink.builder()
                .user(user)
                .url(url)
                .title(title)
                .build();
        return profileLinkRepository.save(link);
    }

    @Transactional
    public void removeProfileLink(Long linkId, Long userId) {
        ProfileLink link = profileLinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Link not found"));
        if (!link.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        profileLinkRepository.delete(link);
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

    public List<LoginHistory> getLoginHistory(Long userId) {
        return loginHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getSuspiciousLoginCount(Long userId) {
        return loginHistoryRepository.countByUserIdAndSuccessfulFalseAndCreatedAtAfter(
                userId, java.time.LocalDateTime.now().minusHours(24));
    }
}
