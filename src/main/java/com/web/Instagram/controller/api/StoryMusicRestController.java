package com.web.Instagram.controller.api;

import com.web.Instagram.entity.StoryMusic;
import com.web.Instagram.service.StoryMusicService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/story-music")
@RequiredArgsConstructor
public class StoryMusicRestController {

    private final StoryMusicService storyMusicService;

    @GetMapping("/trending")
    public ResponseEntity<List<StoryMusic>> getTrending() {
        return ResponseEntity.ok(storyMusicService.getTrendingMusic());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<StoryMusic>> search(@RequestParam String query,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(storyMusicService.searchMusic(query, page, size));
    }

    @PostMapping
    public ResponseEntity<StoryMusic> create(@RequestBody StoryMusic music) {
        return ResponseEntity.ok(storyMusicService.createMusic(music));
    }
}