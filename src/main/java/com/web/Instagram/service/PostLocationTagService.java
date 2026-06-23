package com.web.Instagram.service;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.PostLocationTag;
import com.web.Instagram.repository.PostLocationTagRepository;
import com.web.Instagram.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostLocationTagService {

    private final PostLocationTagRepository locationTagRepository;
    private final PostRepository postRepository;

    @Transactional
    public PostLocationTag addLocationTag(Long postId, String name, String address, String city, String country, Double lat, Double lng, String placeId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        PostLocationTag tag = PostLocationTag.builder()
            .post(post).name(name).address(address).city(city)
            .country(country).latitude(lat).longitude(lng).placeId(placeId).build();
        return locationTagRepository.save(tag);
    }

    public List<PostLocationTag> getPostLocationTags(Long postId) {
        return locationTagRepository.findByPostId(postId);
    }

    @Transactional
    public void removeLocationTag(Long tagId) {
        locationTagRepository.deleteById(tagId);
    }

    @Transactional
    public void removeLocationTagsByPost(Long postId) {
        locationTagRepository.deleteByPostId(postId);
    }

    public List<PostLocationTag> searchLocations(String query) {
        return locationTagRepository.findByNameContainingIgnoreCase(query);
    }
}