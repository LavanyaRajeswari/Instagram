package com.web.Instagram.repository;

import com.web.Instagram.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

    long countByChatIdAndSeenFalseAndSenderIdNot(Long chatId, Long senderId);

    @Modifying
    @Query("UPDATE Message m SET m.seen = true WHERE m.chat.id = :chatId AND m.seen = false")
    void markAllAsSeen(@Param("chatId") Long chatId);

    @Query("select m from Message m where m.chat.id = :chatId and m.deleted = false order by m.createdAt desc")
    Page<Message> findActiveByChatId(@Param("chatId") Long chatId, Pageable pageable);
}
