package com.web.Instagram.service;

import com.web.Instagram.entity.Media;
import com.web.Instagram.entity.MediaType;
import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Page<Post> getReels(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 30);

        return postRepository.findDistinctByMediaType(
                MediaType.VIDEO,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }

    public Post getPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    @Transactional
    public Post createPost(Long userId, String caption, MultipartFile[] files) {
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
        List<Media> mediaList = new ArrayList<>();
        int sortOrder = 0;

        for (MultipartFile file : files) {

            if (file.isEmpty()) {
                continue;
            }

            validateFile(file);

            Map<String, Object> result = cloudinaryService.uploadFile(file);

            Media media = new Media();
            media.setMediaUrl(result.get("secure_url").toString());
            media.setPublicId(result.get("public_id").toString());
            media.setMediaType(MediaType.valueOf(file.getContentType().startsWith("video/") ? "VIDEO" : "IMAGE"));
            media.setSortOrder(sortOrder++);
            media.setPost(post);
            mediaList.add(media);
        }

        post.setMedia(mediaList);

        return postRepository.save(post);
    }

    @Transactional
    public Post editPost(Long postId, String caption, MultipartFile[] files) {
        Post post = getPost(postId);
        post.setCaption(caption);

        if (files != null && files.length > 0 && !files[0].isEmpty()) {

            if (files.length > 10) {
                throw new RuntimeException("Maximum 10 files allowed");
            }

            deleteMediaFiles(post);
            List<Media> mediaList = new ArrayList<>();
            int sortOrder = 0;

            for (MultipartFile file : files) {
                validateFile(file);
                Map<String, Object> result = cloudinaryService.uploadFile(file);
                Media media = new Media();
                media.setMediaUrl(result.get("secure_url").toString());
                media.setPublicId(result.get("public_id").toString());
                media.setMediaType(MediaType.valueOf(file.getContentType().startsWith("video/") ? "VIDEO" : "IMAGE"));
                media.setSortOrder(sortOrder++);
                media.setPost(post);

                mediaList.add(media);
            }
            post.getMedia().clear();
            post.getMedia().addAll(mediaList);
        }
        return postRepository.save(post);
    }

    @Transactional
    public void deletePost(Long postId) {
        Post post = getPost(postId);
        deleteMediaFiles(post);
        postRepository.delete(post);
    }

    private void deleteMediaFiles(Post post) {
        for (Media media : post.getMedia()) {
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
}
