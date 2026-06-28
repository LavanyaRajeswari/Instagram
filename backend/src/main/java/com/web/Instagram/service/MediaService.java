package com.web.Instagram.service;

import com.web.Instagram.entity.Media;
import com.web.Instagram.entity.Post;
import com.web.Instagram.repository.MediaRepository;
import com.web.Instagram.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final PostRepository postRepository;
    private final CloudinaryService cloudinaryService;

    public List<Media> getPostMedia(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        return post.getMedia().stream().sorted((a, b) ->
            Integer.compare(a.getSortOrder(), b.getSortOrder())).toList();
    }

    public Media getMedia(Long mediaId) {
        return mediaRepository.findById(mediaId)
            .orElseThrow(() -> new RuntimeException("Media not found"));
    }

    @Transactional
    public Media updateSortOrder(Long mediaId, int sortOrder, Long userId) {
        Media media = getMedia(mediaId);
        Post post = media.getPost();
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        media.setSortOrder(sortOrder);
        return mediaRepository.save(media);
    }

    @Transactional
    public void deleteMedia(Long mediaId, Long userId) {
        Media media = getMedia(mediaId);
        Post post = media.getPost();
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        cloudinaryService.deleteFile(media.getPublicId());
        mediaRepository.delete(media);
    }
}