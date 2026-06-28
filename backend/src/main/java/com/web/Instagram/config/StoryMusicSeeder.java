package com.web.Instagram.config;

import com.web.Instagram.entity.StoryMusic;
import com.web.Instagram.repository.StoryMusicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class StoryMusicSeeder implements CommandLineRunner {

    private final StoryMusicRepository storyMusicRepository;
    private static final List<StoryMusic> TELUGU_STORY_SONGS = List.of(
            song("Samajavaragamana", "Sid Sriram", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ad/22/44/ad224483-fb25-67ae-71cd-d1da020127ae/mzaf_17415433725855260412.plus.aac.p.m4a", "Telugu", 219818L, 96L),
            song("Maate Vinaduga", "Sid Sriram", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/64/be/71/64be714f-e61c-22b4-426e-10ca4d41ea9e/mzaf_8204469692647636183.plus.aac.p.m4a", "Telugu", 296220L, 91L),
            song("Thassadiya", "Jaspreet Jasz, M.M. Manasi", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/20/d7/64/20d764e1-f7bc-632c-7988-c2ec6f9554b2/mzaf_9739241715327852547.plus.aac.p.m4a", "Telugu", 265964L, 88L),
            song("Y This Kolavari", "Anirudh Ravichander, Dhanush", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9c/b6/47/9cb647c8-7a88-e45a-3d96-26d60432fd9e/mzaf_18327520659217913330.plus.aac.p.m4a", "Telugu Soundtrack", 260067L, 84L),
            song("Enduko Emo", "Aalap Raju, Prashanthi", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/3b/03/01/3b0301ee-8f59-5126-7e40-3e42a7695e57/mzaf_18360355624114429146.plus.aac.p.m4a", "Telugu", 330505L, 79L),
            song("Arre Manasa", "Sid Sriram, Vivek Sagar", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d0/83/23/d0832366-4bcb-50f9-1678-000a40b436b0/mzaf_18182768239280029915.plus.aac.p.m4a", "Telugu", 301500L, 76L),
            song("Maduvarame", "Sameera Bharadwaj", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/57/b4/1c/57b41ce8-e06a-004d-4c45-e1df6075952a/mzaf_10329540780063543976.plus.aac.p.m4a", "Telugu", 343214L, 72L),
            song("Sahana Sahana", "S.S. Thaman, Vishal Mishra, Sruthi Ranjani, Krishna Kanth", "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/3c/6b/91/3c6b9168-b17e-d01b-3bb0-ea2bdac1c714/mzaf_13107108607344631966.plus.aac.p.m4a", "Telugu", 263075L, 69L)
    );

    @Override
    public void run(String... args) {
        List<StoryMusic> existingSongs = storyMusicRepository.findAll();
        if (matchesTeluguStorySongs(existingSongs)) {
            return;
        }

        storyMusicRepository.deleteAll();
        storyMusicRepository.saveAll(TELUGU_STORY_SONGS);
    }

    private boolean matchesTeluguStorySongs(List<StoryMusic> existingSongs) {
        if (existingSongs.size() != TELUGU_STORY_SONGS.size()) {
            return false;
        }

        Map<String, String> expectedUrlsByTitle = TELUGU_STORY_SONGS.stream()
                .collect(Collectors.toMap(StoryMusic::getTitle, StoryMusic::getAudioUrl));

        return existingSongs.stream()
                .allMatch(song -> expectedUrlsByTitle.getOrDefault(song.getTitle(), "").equals(song.getAudioUrl()));
    }

    private static StoryMusic song(String title, String artist, String audioUrl, String genre, Long durationMs, Long usageCount) {
        return StoryMusic.builder()
                .title(title)
                .artist(artist)
                .audioUrl(audioUrl)
                .genre(genre)
                .durationMs(durationMs)
                .isTrending(true)
                .usageCount(usageCount)
                .build();
    }
}
