package com.web.Instagram.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.web.Instagram.entity.MediaType;
import com.web.Instagram.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p join p.media m
        where m.mediaType = :mediaType
          and coalesce(p.user.isPrivate, false) = false
        order by p.createdAt desc
    """)
    Page<Post> findDistinctByMediaType(@Param("mediaType") MediaType mediaType, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p join p.media m
        where m.mediaType = :mediaType
          and (
            coalesce(p.user.isPrivate, false) = false
            or exists (select f from Follow f where f.follower.id = :userId and f.following.id = p.user.id)
          )
        order by p.createdAt desc
    """)
    Page<Post> findDistinctByMediaTypeWithFollowed(@Param("mediaType") MediaType mediaType, @Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p where coalesce(p.user.isPrivate, false) = false order by p.createdAt desc")
    Page<Post> findAllPosts(Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where lower(p.caption) like lower(concat('%', :query, '%'))
          and coalesce(p.user.isPrivate, false) = false
        order by p.createdAt desc
    """)
    Page<Post> searchPosts(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select p from Post p
        where coalesce(p.user.isPrivate, false) = false
        order by
            ((select count(l) from Like l where l.post = p) * 5 +
             (select count(c) from Comment c where c.post = p) * 3 +
             (select count(s) from Share s where s.post = p) * 4 +
             (select count(sp) from SavedPost sp where sp.post = p) * 6) desc,
            p.createdAt desc
    """)
    Page<Post> findExplorePostsByEngagement(Pageable pageable);

    long countByUserId(Long userId);

    long countByOriginalPostId(Long originalPostId);

    boolean existsByUserIdAndOriginalPostId(Long userId, Long originalPostId);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("update Post p set p.originalPost = null where p.originalPost.id = :originalPostId")
    void clearOriginalPostReferences(@Param("originalPostId") Long originalPostId);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p where p.user.id = :userId order by p.createdAt desc")
    Page<Post> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where (p.user.id in (select f.following.id from Follow f where f.follower.id = :userId) or p.user.id = :userId)
          and p.user.id not in (select b.blocked.id from BlockedUser b where b.blocker.id = :userId)
          and p.user.id not in (select b.blocker.id from BlockedUser b where b.blocked.id = :userId)
        order by p.createdAt desc
    """)
    Page<Post> findFeedPosts(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        left join Hashtag h on h.postId = p.id
        where (
            h.tag = :tag
            or replace(h.tag, '-', '') = :compactTag
            or lower(p.caption) like lower(concat('%#', :tag, '%'))
            or replace(lower(p.caption), '-', '') like lower(concat('%#', :compactTag, '%'))
          )
          and (
            coalesce(p.user.isPrivate, false) = false
            or (:requesterUsername is not null and p.user.username = :requesterUsername)
            or (:requesterUsername is not null and exists (
                select f.id from Follow f
                where f.follower.username = :requesterUsername
                  and f.following.id = p.user.id
            ))
          )
        order by p.createdAt desc
    """)
    Page<Post> findVisiblePostsByHashtag(
            @Param("tag") String tag,
            @Param("compactTag") String compactTag,
            @Param("requesterUsername") String requesterUsername,
            Pageable pageable);

    @Query("""
        select count(distinct p.id) from Post p
        left join Hashtag h on h.postId = p.id
        where (
            h.tag = :tag
            or replace(h.tag, '-', '') = :compactTag
            or lower(p.caption) like lower(concat('%#', :tag, '%'))
            or replace(lower(p.caption), '-', '') like lower(concat('%#', :compactTag, '%'))
          )
          and (
            coalesce(p.user.isPrivate, false) = false
            or (:requesterUsername is not null and p.user.username = :requesterUsername)
            or (:requesterUsername is not null and exists (
                select f.id from Follow f
                where f.follower.username = :requesterUsername
                  and f.following.id = p.user.id
            ))
          )
    """)
    long countVisiblePostsByHashtag(
            @Param("tag") String tag,
            @Param("compactTag") String compactTag,
            @Param("requesterUsername") String requesterUsername);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where lower(p.caption) like lower(concat('%@', :username, '%'))
        order by p.createdAt desc
    """)
    List<Post> findByCaptionMentioningUsername(@Param("username") String username);

    @Query("select p.originalPost.id, count(p) from Post p where p.originalPost.id in :ids group by p.originalPost.id")
    List<Object[]> countByOriginalPostIdIn(@Param("ids") List<Long> ids);
}
