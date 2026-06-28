package com.web.Instagram.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HashtagSchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("alter table if exists hashtags drop constraint if exists hashtags_tag_key");
        jdbcTemplate.execute("alter table if exists hashtags drop constraint if exists idx_hashtag_tag");
        jdbcTemplate.execute("drop index if exists idx_hashtag_tag");
        jdbcTemplate.execute("create index if not exists idx_hashtag_tag on hashtags (tag)");
    }
}
