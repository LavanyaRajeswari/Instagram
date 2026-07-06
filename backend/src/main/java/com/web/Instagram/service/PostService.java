package com.web.Instagram.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.web.Instagram.dto.post.PostResponse;
import com.web.Instagram.entity.Media;
import com.web.Instagram.entity.MediaType;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.CommentLikeRepository;
import com.web.Instagram.repository.CommentRepository;
import com.web.Instagram.repository.FollowRepository;
import com.web.Instagram.repository.LikeRepository;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.SavedPostRepository;
import com.web.Instagram.repository.ShareRepository;
import com.web.Instagram.repository.UserRepository;
import com.web.Instagram.repository.BlockedUserRepository;
import com.web.Instagram.repository.ActivityRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.domain.PageImpl;
import java.util.Collections;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final CommentRepository commentRepository;
    private final FollowRepository followRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final LikeRepository likeRepository;
    private final SavedPostRepository savedPostRepository;
    private final ShareRepository shareRepository;
    private final HashtagService hashtagService;
    private final TagService tagService;
    private final BlockedUserRepository blockedUserRepository;
    private final ActivityRepository activityRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private List<Long> getPopularPostIdsFromRedis(int page, int limit) {
        int start = page * limit;
        int end = (page + 1) * limit - 1;
        String redisKey = "popular_posts";
        Set<String> idsStr = redisTemplate.opsForZSet().reverseRange(redisKey, start, end);
        if (idsStr == null || idsStr.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> ids = new ArrayList<>();
        for (String id : idsStr) {
            try {
                ids.add(Long.parseLong(id));
            } catch (NumberFormatException ignored) {}
        }
        return ids;
    }

    private boolean isVisibleToUser(Post post, Long userId) {
        if (post.getUser() == null) return false;
        if (post.getUser().getAccountStatus() != null && "DELETED".equalsIgnoreCase(post.getUser().getAccountStatus())) {
            return false;
        }
        if (userId != null) {
            if (blockedUserRepository.existsByBlockerIdAndBlockedId(userId, post.getUser().getId()) ||
                blockedUserRepository.existsByBlockerIdAndBlockedId(post.getUser().getId(), userId)) {
                return false;
            }
        }
        if (Boolean.TRUE.equals(post.getUser().getIsPrivate())) {
            if (userId == null) return false;
            if (post.getUser().getId().equals(userId)) return true;
            return followRepository.existsByFollowerIdAndFollowingId(userId, post.getUser().getId());
        }
        return true;
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(Long userId, Pageable pageable) {
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();

        int targetPopularCount = size / 2;
        int targetFollowedCount = size - targetPopularCount;

        List<Long> popularIds = getPopularPostIdsFromRedis(page, targetPopularCount);
        List<Post> popularPosts = new ArrayList<>();
        if (!popularIds.isEmpty()) {
            List<Post> fetchedPopular = postRepository.findAllById(popularIds);
            Map<Long, Post> postMap = fetchedPopular.stream()
                    .collect(Collectors.toMap(Post::getId, p -> p));
            for (Long id : popularIds) {
                Post p = postMap.get(id);
                if (p != null && isVisibleToUser(p, userId)) {
                    popularPosts.add(p);
                }
            }
        }

        Page<Post> followedPage = postRepository.findFeedPosts(userId, PageRequest.of(page, targetFollowedCount));
        List<Post> followedPosts = followedPage.getContent();

        // 3. Interleave and deduplicate
        List<Post> combinedList = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();

        int maxLen = Math.max(popularPosts.size(), followedPosts.size());
        for (int i = 0; i < maxLen; i++) {
            if (i < popularPosts.size()) {
                Post p = popularPosts.get(i);
                if (seenIds.add(p.getId())) {
                    combinedList.add(p);
                }
            }
            if (i < followedPosts.size()) {
                Post p = followedPosts.get(i);
                if (seenIds.add(p.getId())) {
                    combinedList.add(p);
                }
            }
        }

        // 4. Backfill if combinedList size is less than requested size or both are exhausted
        boolean popularExhausted = popularIds.size() < targetPopularCount;
        boolean followedExhausted = followedPosts.size() < targetFollowedCount;

        if (combinedList.size() < size || (popularExhausted && followedExhausted)) {
            Page<Post> overallPage = postRepository.findOverallCollectionPosts(userId, PageRequest.of(page, size));
            for (Post p : overallPage.getContent()) {
                if (seenIds.add(p.getId())) {
                    combinedList.add(p);
                    if (combinedList.size() >= size) {
                        break;
                    }
                }
            }
        }

        long totalElements = postRepository.count();
        Page<Post> combinedPage = new PageImpl<>(combinedList, pageable, totalElements);
        return mapToResponse(combinedPage, userId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getUserPosts(Long userId, Pageable pageable, Long currentUserId) {
        return mapToResponse(postRepository.findByUserId(userId, pageable), currentUserId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getExplorePosts(Pageable pageable, Long currentUserId) {
        return mapToResponse(postRepository.findExplorePostsByEngagement(pageable), currentUserId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> searchPosts(String query, Pageable pageable, Long currentUserId) {
        return mapToResponse(postRepository.searchPosts(query, pageable), currentUserId);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "reels", key = "#userId + ':' + #page + ':' + #size")
    public Page<PostResponse> getReels(Long userId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 30);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (userId != null) {
            return mapToResponse(postRepository.findDistinctByMediaTypeWithFollowed(MediaType.VIDEO, userId, pageable), userId);
        }
        return mapToResponse(postRepository.findDistinctByMediaType(MediaType.VIDEO, pageable), null);
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return toResponse(post, currentUserId());
    }

    public Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof com.web.Instagram.entity.User u) return u.getId();
        return null;
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "postById", "feed", "reels"}, allEntries = true)
    public PostResponse createPost(Long userId, String caption, MultipartFile[] files, Long musicId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (files == null || files.length == 0) {
            throw new RuntimeException("At least one file is required");
        }

        if (files.length > 10) {
            throw new RuntimeException("Maximum 10 files allowed");
        }

        Post post = new Post();
        post.setCaption(caption);
        post.setUser(user);
        post.setMusicId(musicId);
        List<Media> mediaList = new ArrayList<>();
        int sortOrder = 0;

        for (MultipartFile file : files) {

            if (file.isEmpty()) {
                continue;
            }

            validateFile(file);

            Map<String, Object> cloudResult = cloudinaryService.uploadFile(file);
            Object secureUrl = cloudResult != null ? cloudResult.get("secure_url") : null;
            Object publicId = cloudResult != null ? cloudResult.get("public_id") : null;
            if (secureUrl == null || publicId == null) {
                throw new RuntimeException("Failed to upload file to Cloudinary");
            }

            Media media = new Media();
            media.setMediaUrl(secureUrl.toString());
            media.setPublicId(publicId.toString());
            media.setMediaType(MediaType.valueOf(file.getContentType().startsWith("video/") ? "VIDEO" : "IMAGE"));
            media.setSortOrder(sortOrder++);
            media.setPost(post);
            mediaList.add(media);
        }

        post.setMedia(mediaList);

        Post saved = postRepository.save(post);
        hashtagService.saveHashtags(caption, saved.getId());
        tagService.saveMentionTags(caption, saved.getId());
        return toResponse(saved, userId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "postById", "feed", "reels"}, allEntries = true)
    public PostResponse repost(Long userId, Long originalPostId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post original = getPostEntity(originalPostId);

        if (original.getUser().getId().equals(userId)) {
            throw new RuntimeException("You cannot repost your own post");
        }

        if (original.getMedia() == null || original.getMedia().isEmpty()) {
            throw new RuntimeException("Post has no media to repost");
        }

        Post sourcePost = original.getOriginalPost() != null ? original.getOriginalPost() : original;
        if (postRepository.existsByUserIdAndOriginalPostId(userId, sourcePost.getId())) {
            throw new RuntimeException("You have already reposted this post");
        }

        Post repost = new Post();
        repost.setCaption(original.getCaption());
        repost.setUser(user);
        repost.setOriginalPost(sourcePost);
        repost.setMusicId(original.getMusicId());
        repost.setVisibility(original.getVisibility());
        repost.setCommentsDisabled(original.getCommentsDisabled());
        repost.setHideLikeCount(original.getHideLikeCount());

        List<Media> repostMedia = new ArrayList<>();
        for (Media originalMedia : sourcePost.getMedia()) {
            Media media = new Media();
            media.setMediaUrl(originalMedia.getMediaUrl());
            media.setMediaType(originalMedia.getMediaType());
            media.setSortOrder(originalMedia.getSortOrder());
            media.setPublicId("repost:" + originalMedia.getId());
            media.setPost(repost);
            repostMedia.add(media);
        }
        repost.setMedia(repostMedia);

        Post saved = postRepository.save(repost);
        hashtagService.saveHashtags(saved.getCaption(), saved.getId());
        tagService.saveMentionTags(saved.getCaption(), saved.getId());
        return toResponse(saved, userId);
    }


    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public PostResponse editPost(Long postId, String caption, MultipartFile[] files, Long musicId, Long userId) {
        Post post = getPostEntity(postId);
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        hashtagService.removeHashtagsByPost(postId);
        tagService.removeTagsByPost(postId);
        post.setCaption(caption);
        post.setMusicId(musicId);

        if (files != null && files.length > 0 && !files[0].isEmpty()) {

            if (files.length > 10) {
                throw new RuntimeException("Maximum 10 files allowed");
            }

            deleteMediaFiles(post);
            List<Media> mediaList = new ArrayList<>();
            int sortOrder = 0;

            for (MultipartFile file : files) {
                validateFile(file);
                Map<String, Object> cloudResult = cloudinaryService.uploadFile(file);
                Object secureUrl = cloudResult != null ? cloudResult.get("secure_url") : null;
                Object publicId = cloudResult != null ? cloudResult.get("public_id") : null;
                if (secureUrl == null || publicId == null) {
                    throw new RuntimeException("Failed to upload file to Cloudinary");
                }
                Media media = new Media();
                media.setMediaUrl(secureUrl.toString());
                media.setPublicId(publicId.toString());
                media.setMediaType(MediaType.valueOf(file.getContentType().startsWith("video/") ? "VIDEO" : "IMAGE"));
                media.setSortOrder(sortOrder++);
                media.setPost(post);

                mediaList.add(media);
            }
            post.getMedia().clear();
            post.getMedia().addAll(mediaList);
        }
        Post saved = postRepository.save(post);
        hashtagService.saveHashtags(caption, saved.getId());
        tagService.saveMentionTags(caption, saved.getId());
        return toResponse(saved, userId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"userProfiles", "postById", "feed", "reels"}, allEntries = true)
    public void deletePost(Long postId, Long userId) {
        Post post = getPostEntity(postId);
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        hashtagService.removeHashtagsByPost(postId);
        tagService.removeTagsByPost(postId);
        commentLikeRepository.deleteByCommentPostId(postId);
        commentRepository.deleteByPostId(postId);
        likeRepository.deleteByPostId(postId);
        savedPostRepository.deleteByPostId(postId);
        shareRepository.deleteByPostId(postId);
        postRepository.clearOriginalPostReferences(postId);

        activityRepository.deleteByPostId(postId);
        redisTemplate.opsForZSet().remove("popular_posts", postId.toString());

        deleteMediaFiles(post);
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public Post getPostEntity(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    private Page<PostResponse> mapToResponse(Page<Post> page, Long currentUserId) {
        List<Post> posts = page.getContent();
        if (posts.isEmpty()) return page.map(p -> toResponse(p, currentUserId));
        List<Long> ids = posts.stream().map(Post::getId).toList();

        Map<Long, Long> likeCounts = toMap(likeRepository.countByPostIdIn(ids));
        Map<Long, Long> commentCounts = toMap(commentRepository.countByPostIdIn(ids));
        Map<Long, Long> saveCounts = toMap(savedPostRepository.countByPostIdIn(ids));
        Map<Long, Long> shareCounts = toMap(shareRepository.countByPostIdIn(ids));
        Map<Long, Long> repostCounts = toMap(postRepository.countByOriginalPostIdIn(ids));

        Set<Long> likedIds = currentUserId != null
                ? new HashSet<>(likeRepository.findPostIdsLikedByUser(currentUserId, ids)) : Set.of();
        Set<Long> savedIds = currentUserId != null
                ? new HashSet<>(savedPostRepository.findPostIdsSavedByUser(currentUserId, ids)) : Set.of();
        List<Long> ownerIds = posts.stream().map(p -> p.getUser().getId()).distinct().toList();
        Set<Long> followedOwnerIds = currentUserId != null
                ? new HashSet<>(followRepository.findFollowingUserIds(currentUserId, ownerIds)) : Set.of();

        return page.map(post -> buildResponse(post, likeCounts, commentCounts, saveCounts, shareCounts,
                repostCounts, likedIds, savedIds, followedOwnerIds));
    }

    private static Map<Long, Long> toMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
            r -> ((Number) r[0]).longValue(),
            r -> ((Number) r[1]).longValue()
        ));
    }

    public PostResponse toResponse(Post post, Long currentUserId) {
        long likeCount = likeRepository.countByPostId(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());
        long saveCount = savedPostRepository.countByPostId(post.getId());
        long shareCount = shareRepository.countByPostId(post.getId());
        Long repostSourceId = post.getOriginalPost() != null ? post.getOriginalPost().getId() : post.getId();
        long repostCount = postRepository.countByOriginalPostId(repostSourceId);
        boolean liked = currentUserId != null && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());
        boolean saved = currentUserId != null && savedPostRepository.existsByUserIdAndPostId(currentUserId, post.getId());
        boolean followingOwner = currentUserId != null
                && followRepository.existsByFollowerIdAndFollowingId(currentUserId, post.getUser().getId());
        return buildResponse(post,
                Map.of(post.getId(), likeCount), Map.of(post.getId(), commentCount),
                Map.of(post.getId(), saveCount), Map.of(post.getId(), shareCount),
                Map.of(repostSourceId, repostCount),
                liked ? Set.of(post.getId()) : Set.of(),
                saved ? Set.of(post.getId()) : Set.of(),
                followingOwner ? Set.of(post.getUser().getId()) : Set.of());
    }

    private PostResponse buildResponse(Post post, Map<Long, Long> likeCounts, Map<Long, Long> commentCounts,
                                        Map<Long, Long> saveCounts, Map<Long, Long> shareCounts,
                                        Map<Long, Long> repostCounts,
                                        Set<Long> likedIds, Set<Long> savedIds, Set<Long> followedOwnerIds) {
        Long postId = post.getId();
        User user = post.getUser();
        Post originalPost = post.getOriginalPost();
        User originalPostUser = originalPost != null ? originalPost.getUser() : null;
        Long repostSourceId = originalPost != null ? originalPost.getId() : postId;

        return PostResponse.builder()
                .id(postId)
                .caption(post.getCaption())
                .createdAt(post.getCreatedAt())
                .likeCount(likeCounts.getOrDefault(postId, 0L))
                .commentCount(commentCounts.getOrDefault(postId, 0L))
                .saveCount(saveCounts.getOrDefault(postId, 0L))
                .shareCount(shareCounts.getOrDefault(postId, 0L))
                .repostCount(repostCounts.getOrDefault(repostSourceId, 0L))
                .originalPostId(originalPost != null ? originalPost.getId() : null)
                .visibility(post.getVisibility())
                .hideLikeCount(Boolean.TRUE.equals(post.getHideLikeCount()))
                .commentsDisabled(Boolean.TRUE.equals(post.getCommentsDisabled()) ||
                        Boolean.TRUE.equals(user.getCommentsDisabled()))
                .likedByCurrentUser(likedIds.contains(postId))
                .savedByCurrentUser(savedIds.contains(postId))
                .followingOwner(followedOwnerIds.contains(user.getId()))
                .user(PostResponse.PostUser.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .profilePicture(user.getProfilePicture())
                        .createdAt(user.getCreatedAt())
                        .commentsDisabled(Boolean.TRUE.equals(user.getCommentsDisabled()))
                        .build())
                .originalPostUser(originalPostUser != null ? PostResponse.PostUser.builder()
                        .id(originalPostUser.getId())
                        .username(originalPostUser.getUsername())
                        .fullName(originalPostUser.getFullName())
                        .profilePicture(originalPostUser.getProfilePicture())
                        .createdAt(originalPostUser.getCreatedAt())
                        .commentsDisabled(Boolean.TRUE.equals(originalPostUser.getCommentsDisabled()))
                        .build() : null)
                .media(post.getMedia().stream()
                        .map(m -> PostResponse.PostMedia.builder()
                                .id(m.getId())
                                .mediaUrl(m.getMediaUrl())
                                .mediaType(m.getMediaType().name())
                                .sortOrder(m.getSortOrder() != null ? m.getSortOrder() : 0)
                                .build())
                        .toList())
                .build();
    }

    private void deleteMediaFiles(Post post) {
        for (Media media : post.getMedia()) {
            if (media.getPublicId() != null && media.getPublicId().startsWith("repost:")) {
                continue;
            }
            cloudinaryService.deleteFile(media.getPublicId());
        }
    }

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new RuntimeException(
                    "Only image and video files are allowed"
            );
        }
    }

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public void setHideLikeCount(Long postId, boolean hide, Long userId) {
        Post post = getPostEntity(postId);
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        post.setHideLikeCount(hide);
        postRepository.save(post);
    }

    @Transactional
    @CacheEvict(cacheNames = {"postById", "feed", "reels"}, allEntries = true)
    public void setCommentsDisabled(Long postId, boolean disabled, Long userId) {
        Post post = getPostEntity(postId);
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        post.setCommentsDisabled(disabled);
        postRepository.save(post);
    }

}
