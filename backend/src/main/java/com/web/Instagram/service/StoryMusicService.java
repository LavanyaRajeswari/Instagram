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

    private static final List<DefaultSong> DEFAULT_SONGS = List.of(
            song("Samajavaragamana", "S.S. Thaman & Sid Sriram",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/94/15/98/941598ae-7248-357a-1e07-be7d50ea7b08/mzaf_11251795343892643096.plus.aac.p.m4a", 219818L, 96L),
            song("Inkem Inkem Inkem Kaavaale", "Sid Sriram",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6d/5a/f1/6d5af141-475c-7404-495c-0ef55283457c/mzaf_3028662401385709025.plus.aac.p.m4a", 266000L, 93L),
            song("Maate Vinadhuga", "Sid Sriram",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/27/4c/07274cc8-f662-8747-e425-1108ba2a2390/mzaf_12339835384962827073.plus.aac.p.m4a", 296220L, 91L),
            song("Buttabomma", "Armaan Malik & S.S. Thaman",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/00/87/1c/00871cd6-9a64-717a-2072-d19c49f94682/mzaf_4402448724622500589.plus.aac.p.m4a", 198000L, 89L),
            song("Oo Antava Oo Oo Antava", "Indravathi Chauhan & Devi Sri Prasad",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/5d/86/595d8694-c034-2040-9a11-2f117ed32ea4/mzaf_8961189800316643417.plus.aac.p.m4a", 223000L, 87L),
            song("Srivalli", "Sid Sriram",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9b/4a/e3/9b4ae3a2-43ee-dd7b-0474-3b7e914513cf/mzaf_10743675123561433132.plus.aac.p.m4a", 221000L, 85L),
            song("Vachindamma", "Sid Sriram",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3b/a0/a1/3ba0a1ce-bf63-bbaf-48f6-48593c231168/mzaf_16000697806590920631.plus.aac.p.m4a", 250000L, 82L),
            song("Nee Kannu Neeli Samudram", "Javed Ali & Devi Sri Prasad",
                    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/12/85/34/12853461-4a89-0825-f8b9-f34a4244237d/mzaf_7933769262972519634.plus.aac.p.m4a", 312000L, 80L)
    );

    @Transactional
    public List<StoryMusic> getAllMusic() {
        ensureDefaultMusic();
        return storyMusicRepository.findAllByOrderByUsageCountDesc();
    }

    @Transactional
    public List<StoryMusic> getTrendingMusic() {
        ensureDefaultMusic();
        return storyMusicRepository.findTop10ByOrderByUsageCountDesc();
    }

    @Transactional
    public Page<StoryMusic> searchMusic(String query, int page, int size) {
        ensureDefaultMusic();
        return storyMusicRepository.searchByTitleOrArtist(query, PageRequest.of(page, size));
    }

    @Transactional
    public StoryMusic createMusic(StoryMusic music) {
        return storyMusicRepository.save(music);
    }

    public List<StoryMusic> getTrending(int limit) {
        ensureDefaultMusic();
        return storyMusicRepository.findByIsTrendingTrueOrderByUsageCountDesc(PageRequest.of(0, limit));
    }

    private void ensureDefaultMusic() {
        if (storyMusicRepository.count() == 0) {
            seedDefaultMusic();
            return;
        }

        List<StoryMusic> existingSongs = storyMusicRepository.findAll();
        List<StoryMusic> correctedSongs = existingSongs.stream()
                .filter(this::applyDefaultMetadata)
                .toList();
        if (!correctedSongs.isEmpty()) {
            storyMusicRepository.saveAll(correctedSongs);
        }
    }

    private boolean applyDefaultMetadata(StoryMusic existingSong) {
        DefaultSong defaultSong = DEFAULT_SONGS.stream()
                .filter(song -> song.audioUrl().equals(existingSong.getAudioUrl()))
                .findFirst()
                .orElse(null);
        if (defaultSong == null || defaultSong.matches(existingSong)) {
            return false;
        }

        existingSong.setTitle(defaultSong.title());
        existingSong.setArtist(defaultSong.artist());
        existingSong.setDurationMs(defaultSong.durationMs());
        existingSong.setGenre("Telugu");
        return true;
    }

    private void seedDefaultMusic() {
        storyMusicRepository.saveAll(DEFAULT_SONGS.stream()
                .map(DefaultSong::toEntity)
                .toList());
    }

    private static DefaultSong song(String title, String artist, String audioUrl, Long durationMs, Long usageCount) {
        return new DefaultSong(title, artist, audioUrl, durationMs, usageCount);
    }

    private record DefaultSong(String title, String artist, String audioUrl, Long durationMs, Long usageCount) {
        private boolean matches(StoryMusic storyMusic) {
            return title.equals(storyMusic.getTitle())
                    && artist.equals(storyMusic.getArtist())
                    && durationMs.equals(storyMusic.getDurationMs())
                    && "Telugu".equals(storyMusic.getGenre());
        }

        private StoryMusic toEntity() {
            return StoryMusic.builder()
                    .title(title)
                    .artist(artist)
                    .audioUrl(audioUrl)
                    .durationMs(durationMs)
                    .genre("Telugu")
                    .isTrending(true)
                    .usageCount(usageCount)
                    .build();
        }
    }
}
