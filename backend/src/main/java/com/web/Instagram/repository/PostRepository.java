package com.web.Instagram.repository;

import com.web.Instagram.entity.MediaType;
import com.web.Instagram.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p join p.media m where m.mediaType = :mediaType")
    Page<Post> findDistinctByMediaType(@Param("mediaType") MediaType mediaType, Pageable pageable);
}
