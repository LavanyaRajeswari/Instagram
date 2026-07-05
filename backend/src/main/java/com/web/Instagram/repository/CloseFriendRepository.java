package com.web.Instagram.repository;

import com.web.Instagram.entity.CloseFriend;
import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CloseFriendRepository extends JpaRepository<CloseFriend, Long> {

    boolean existsByOwnerAndFriend(User owner, User friend);

    Optional<CloseFriend> findByOwnerAndFriend(User owner, User friend);

    List<CloseFriend> findByOwner(User owner);

    void deleteByOwnerAndFriend(User owner, User friend);

    @Query("""
        SELECT cf.owner.id
        FROM CloseFriend cf
        WHERE cf.friend.id = :friendId
    """)
    Set<Long> findOwnerIdsByFriendId(@Param("friendId") Long friendId);
}