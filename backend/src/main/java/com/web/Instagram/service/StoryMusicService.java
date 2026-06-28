package com.web.Instagram.service;

import com.web.Instagram.entity.StoryMusic;
import com.web.Instagram.repository.StoryMusicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryMusicService {

    private final StoryMusicRepository storyMusicRepository;

    public List<StoryMusic> getTrendingMusic() {
        return storyMusicRepository.findTop10ByOrderByUsageCountDesc();
    }

    public Page<StoryMusic> searchMusic(String query, int page, int size) {
        return storyMusicRepository.findByTitleContainingIgnoreCase(query, PageRequest.of(page, size));
    }

    @Transactional
    public StoryMusic createMusic(StoryMusic music) {
        return storyMusicRepository.save(music);
    }

    public List<StoryMusic> getTrending(int limit) {
        return storyMusicRepository.findByIsTrendingTrueOrderByUsageCountDesc(PageRequest.of(0, limit));
    }
}