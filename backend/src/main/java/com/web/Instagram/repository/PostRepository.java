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
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p join p.media m where m.mediaType = :mediaType")
    Page<Post> findDistinctByMediaType(@Param("mediaType") MediaType mediaType, Pageable pageable);
    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p order by p.createdAt desc")
    List<Post> findExplorePosts();

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where lower(p.caption) like lower(concat('%', :query, '%'))
        order by p.createdAt desc
    """)
    List<Post> searchPosts(@Param("query") String query);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p
        from Post p
        order by
        (
            (select count(l) from Like l where l.post = p) * 5 +
            (select count(c) from Comment c where c.post = p) * 3 +
            (select count(s) from Share s where s.post = p) * 4 +
            (select count(sp) from SavedPost sp where sp.post = p) * 6
        ) desc,
        p.createdAt desc
    """)
    List<Post> findExplorePostsByEngagement();
}
