package com.web.Instagram.repository;

import com.web.Instagram.entity.MediaType;
import com.web.Instagram.entity.Post;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p join p.media m
        where m.mediaType = :mediaType
          and coalesce(p.user.isPrivate, false) = false
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
        order by p.createdAt desc
    """)
    Page<Post> findDistinctByMediaType(@Param("mediaType") MediaType mediaType, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p join p.media m
        where m.mediaType = :mediaType
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
          and (
            coalesce(p.user.isPrivate, false) = false
            or exists (select f from Follow f where f.follower.id = :userId and f.following.id = p.user.id)
          )
        order by p.createdAt desc
    """)
    Page<Post> findDistinctByMediaTypeWithFollowed(@Param("mediaType") MediaType mediaType, @Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p where coalesce(p.user.isPrivate, false) = false and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED') order by p.createdAt desc")
    Page<Post> findAllPosts(Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where lower(p.caption) like lower(concat('%', :query, '%'))
          and coalesce(p.user.isPrivate, false) = false
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
        order by p.createdAt desc
    """)
    Page<Post> searchPosts(@Param("query") String query, Pageable pageable);

    @Query(value = """
        SELECT DISTINCT p.* FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN (SELECT post_id, COUNT(*) AS lc FROM likes GROUP BY post_id) l ON l.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) AS cc FROM comments GROUP BY post_id) c ON c.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) AS sc FROM shares GROUP BY post_id) s ON s.post_id = p.id
        LEFT JOIN (SELECT post_id, COUNT(*) AS pc FROM saved_posts GROUP BY post_id) sp ON sp.post_id = p.id
        WHERE COALESCE(u.is_private, false) = false
          AND COALESCE(UPPER(u.account_status), '') <> 'DELETED'
        ORDER BY (COALESCE(l.lc,0)*5 + COALESCE(c.cc,0)*3 + COALESCE(s.sc,0)*4 + COALESCE(sp.pc,0)*6) DESC, p.created_at DESC
        """,
        countQuery = "SELECT COUNT(DISTINCT p.id) FROM posts p JOIN users u ON u.id = p.user_id WHERE COALESCE(u.is_private, false) = false AND COALESCE(UPPER(u.account_status), '') <> 'DELETED'",
        nativeQuery = true)
    Page<Post> findExplorePostsByEngagement(Pageable pageable);

    long countByUserId(Long userId);

    long countByOriginalPostId(Long originalPostId);

    boolean existsByUserIdAndOriginalPostId(Long userId, Long originalPostId);

    @Modifying
    @Transactional
    @Query("update Post p set p.originalPost = null where p.originalPost.id = :originalPostId")
    void clearOriginalPostReferences(@Param("originalPostId") Long originalPostId);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("select distinct p from Post p where p.user.id = :userId and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED') order by p.createdAt desc")
    Page<Post> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("select p.id from Post p where p.user.id = :userId")
    List<Long> findIdsByUserId(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where (p.user.id in (select f.following.id from Follow f where f.follower.id = :userId) or p.user.id = :userId)
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
          and p.user.id not in (select b.blocked.id from BlockedUser b where b.blocker.id = :userId)
          and p.user.id not in (select b.blocker.id from BlockedUser b where b.blocked.id = :userId)
        order by p.createdAt desc
    """)
    Page<Post> findFeedPosts(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where (coalesce(p.user.isPrivate, false) = false or p.user.id in (select f.following.id from Follow f where f.follower.id = :userId) or p.user.id = :userId)
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
          and p.user.id not in (select b.blocked.id from BlockedUser b where b.blocker.id = :userId)
          and p.user.id not in (select b.blocker.id from BlockedUser b where b.blocked.id = :userId)
        order by p.createdAt desc
    """)
    Page<Post> findOverallCollectionPosts(@Param("userId") Long userId, Pageable pageable);

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
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
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
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
    """)
    long countVisiblePostsByHashtag(
            @Param("tag") String tag,
            @Param("compactTag") String compactTag,
            @Param("requesterUsername") String requesterUsername);

    @EntityGraph(attributePaths = {"media", "user"})
    @Query("""
        select distinct p from Post p
        where lower(p.caption) like lower(concat('%@', :username, '%'))
          and (p.user.accountStatus is null or upper(p.user.accountStatus) <> 'DELETED')
        order by p.createdAt desc
    """)
    List<Post> findByCaptionMentioningUsername(@Param("username") String username);

    @Query("select p.originalPost.id, count(p) from Post p where p.originalPost.id in :ids group by p.originalPost.id")
    List<Object[]> countByOriginalPostIdIn(@Param("ids") List<Long> ids);
}
