package com.web.Instagram.repository;

import com.web.Instagram.entity.GroupChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface GroupChatMessageRepository extends JpaRepository<GroupChatMessage, Long> {
    @Query("select m from GroupChatMessage m where m.groupChat.id = :groupId order by m.createdAt desc")
    Page<GroupChatMessage> findByGroupChatId(@Param("groupId") Long groupId, Pageable pageable);

    @Query(value = """
        select m.group_chat_id, count(*)
        from group_chat_messages m
        left join group_chat_last_reads r on r.group_chat_id = m.group_chat_id and r.user_id = :userId
        where m.group_chat_id in :groupIds
          and m.sender_id != :userId
          and coalesce(m.deleted, false) = false
          and m.created_at > coalesce(r.last_read_at, '1970-01-01 00:00:00')
        group by m.group_chat_id
        """, nativeQuery = true)
    List<Object[]> countUnreadPerGroupForUser(@Param("groupIds") List<Long> groupIds, @Param("userId") Long userId);
}