package com.web.Instagram.repository;

import com.web.Instagram.entity.GroupChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupChatMessageRepository extends JpaRepository<GroupChatMessage, Long> {
    @Query("select m from GroupChatMessage m where m.groupChat.id = :groupId order by m.createdAt desc")
    Page<GroupChatMessage> findByGroupChatId(@Param("groupId") Long groupId, Pageable pageable);
}