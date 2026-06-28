package com.web.Instagram.repository;

import com.web.Instagram.entity.GroupChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface GroupChatRepository extends JpaRepository<GroupChat, Long> {
    @Query("select g from GroupChat g join g.members m where m.id = :userId order by g.lastMessageAt desc")
    List<GroupChat> findByMembersIdOrderByLastMessageAtDesc(@Param("userId") Long userId);
}