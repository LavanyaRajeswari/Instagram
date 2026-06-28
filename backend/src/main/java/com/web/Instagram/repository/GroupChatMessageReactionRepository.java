package com.web.Instagram.repository;

import com.web.Instagram.entity.GroupChatMessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupChatMessageReactionRepository extends JpaRepository<GroupChatMessageReaction, Long> {
    List<GroupChatMessageReaction> findByMessageId(Long messageId);
    Optional<GroupChatMessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);
    void deleteByMessageIdAndUserId(Long messageId, Long userId);
}