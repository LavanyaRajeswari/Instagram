package com.web.Instagram.repository;

import com.web.Instagram.entity.Hashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    List<Hashtag> findByPostId(Long postId);

    void deleteByPostId(Long postId);

    @Query("select distinct h.tag from Hashtag h where lower(h.tag) like lower(concat(:query, '%')) order by h.tag")
    List<String> searchHashtags(@Param("query") String query);

    @Query("select h.tag, count(h) as cnt from Hashtag h group by h.tag order by cnt desc")
    Page<Object[]> findTrendingHashtags(Pageable pageable);
}
