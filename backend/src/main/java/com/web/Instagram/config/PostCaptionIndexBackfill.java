package com.web.Instagram.config;

import com.web.Instagram.entity.Post;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.service.HashtagService;
import com.web.Instagram.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PostCaptionIndexBackfill implements CommandLineRunner {

    private final PostRepository postRepository;
    private final HashtagService hashtagService;
    private final TagService tagService;

    @Override
    public void run(String... args) {
        for (Post post : postRepository.findAll()) {
            if (post.getCaption() == null || post.getCaption().isBlank()) {
                continue;
            }
            hashtagService.saveHashtags(post.getCaption(), post.getId());
            tagService.saveMentionTags(post.getCaption(), post.getId());
        }
    }
}
