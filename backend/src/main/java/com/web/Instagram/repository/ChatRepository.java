package com.web.Instagram.repository;

import com.web.Instagram.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("select c from Chat c where (c.userOne.id = :userId1 and c.userTwo.id = :userId2) or (c.userOne.id = :userId2 and c.userTwo.id = :userId1) order by c.id asc")
    List<Chat> findExistingChats(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    default Optional<Chat> findExistingChat(Long userId1, Long userId2) {
        return findExistingChats(userId1, userId2).stream().findFirst();
    }

    @Query("select c from Chat c where (c.userOne.id = :userId or c.userTwo.id = :userId) and c.archived = false order by c.lastMessageAt desc")
    List<Chat> findByUserIdAndArchivedFalse(@Param("userId") Long userId);

    @Query("select c from Chat c where (c.userOne.id = :userId or c.userTwo.id = :userId) and c.archived = true order by c.lastMessageAt desc")
    List<Chat> findByUserIdAndArchivedTrue(@Param("userId") Long userId);

}
