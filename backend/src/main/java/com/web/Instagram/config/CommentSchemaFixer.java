package com.web.Instagram.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommentSchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("""
                do $$
                begin
                    if exists (
                        select 1 from information_schema.tables
                        where table_name = 'comments'
                    ) and not exists (
                        select 1 from information_schema.columns
                        where table_name = 'comments' and column_name = 'text'
                    ) then
                        execute 'alter table comments add column text varchar(1000)';
                    end if;

                    if exists (
                        select 1 from information_schema.columns
                        where table_name = 'comments' and column_name = 'content'
                    ) then
                        execute 'alter table comments alter column content drop not null';
                    end if;

                    if exists (
                        select 1 from information_schema.columns
                        where table_name = 'comments' and column_name = 'content'
                    ) and exists (
                        select 1 from information_schema.columns
                        where table_name = 'comments' and column_name = 'text'
                    ) then
                        execute 'update comments set text = content where text is null and content is not null';
                        execute 'alter table comments drop column content';
                    end if;
                end $$;
                """);
    }
}
