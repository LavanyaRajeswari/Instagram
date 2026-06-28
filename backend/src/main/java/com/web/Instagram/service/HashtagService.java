package com.web.Instagram.service;

import com.web.Instagram.entity.Hashtag;
import com.web.Instagram.entity.Post;
import com.web.Instagram.repository.HashtagRepository;
import com.web.Instagram.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HashtagService {

    private final HashtagRepository hashtagRepository;
    private final PostRepository postRepository;

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("(?<![\\p{Alnum}_])#([\\p{Alnum}_][\\p{Alnum}_\\p{Pd}-]*)");

    public String normalizeTag(String tag) {
        if (tag == null) return "";
        return tag.trim()
            .replaceFirst("^#", "")
            .replace('\u2010', '-')
            .replace('\u2011', '-')
            .replace('\u2012', '-')
            .replace('\u2013', '-')
            .replace('\u2014', '-')
            .replace('\u2212', '-')
            .toLowerCase();
    }

    public List<String> extractHashtags(String caption) {
        List<String> tags = new ArrayList<>();
        if (caption == null || caption.isBlank()) return tags;
        Matcher matcher = HASHTAG_PATTERN.matcher(caption);
        while (matcher.find()) {
            tags.add(normalizeTag(matcher.group(1)));
        }
        return tags;
    }

    public boolean captionContainsHashtag(String caption, String tag) {
        String normalizedTarget = normalizeTag(tag);
        String compactTarget = compactTag(normalizedTarget);
        return extractHashtags(caption).stream()
            .anyMatch(found -> found.equals(normalizedTarget) || compactTag(found).equals(compactTarget));
    }

    private String compactTag(String tag) {
        return normalizeTag(tag).replace("-", "");
    }

    @Transactional
    public void saveHashtags(String caption, Long postId) {
        List<String> tags = extractHashtags(caption).stream().distinct().toList();
        if (tags.isEmpty()) return;
        Set<String> existing = hashtagRepository.findByPostId(postId).stream()
                .map(Hashtag::getTag).collect(Collectors.toSet());
        List<Hashtag> newTags = tags.stream()
                .filter(t -> !existing.contains(t))
                .map(t -> Hashtag.builder().tag(t).postId(postId).build())
                .toList();
        if (!newTags.isEmpty()) {
            hashtagRepository.saveAll(newTags);
        }
    }

    @Transactional
    public void removeHashtagsByPost(Long postId) {
        hashtagRepository.deleteByPostId(postId);
    }

    public Page<Post> getVisiblePostsByTag(String tag, String requesterUsername, int page, int size) {
        String normalizedTag = normalizeTag(tag);
        return postRepository.findVisiblePostsByHashtag(
            normalizedTag,
            compactTag(normalizedTag),
            requesterUsername,
            PageRequest.of(page, size)
        );
    }

    public long getVisiblePostCountByTag(String tag, String requesterUsername) {
        String normalizedTag = normalizeTag(tag);
        return postRepository.countVisiblePostsByHashtag(normalizedTag, compactTag(normalizedTag), requesterUsername);
    }

    public List<String> searchHashtags(String query) {
        if (query == null || query.isBlank()) return List.of();
        return hashtagRepository.searchHashtags(query.toLowerCase().trim());
    }

    public List<String> getTrendingHashtags(int limit) {
        Page<Object[]> results = hashtagRepository.findTrendingHashtags(PageRequest.of(0, limit));
        return results.getContent().stream()
            .map(row -> (String) row[0])
            .toList();
    }
}
