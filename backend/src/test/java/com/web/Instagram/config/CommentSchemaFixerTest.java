package com.web.Instagram.config;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CommentSchemaFixerTest {

    @Test
    void migratesLegacyContentColumnToTextColumn() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        CommentSchemaFixer fixer = new CommentSchemaFixer(jdbcTemplate);

        fixer.run();

        var sqlCaptor = forClass(String.class);
        verify(jdbcTemplate).execute(sqlCaptor.capture());

        String sql = sqlCaptor.getValue();
        assertThat(sql).contains("alter table comments add column text varchar(1000)");
        assertThat(sql).contains("alter table comments alter column content drop not null");
        assertThat(sql).contains("update comments set text = content");
        assertThat(sql).contains("alter table comments drop column content");
    }
}
