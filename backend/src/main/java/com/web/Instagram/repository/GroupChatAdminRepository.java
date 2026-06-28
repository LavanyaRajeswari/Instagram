package com.web.Instagram.repository;

import com.web.Instagram.entity.GroupChatAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupChatAdminRepository extends JpaRepository<GroupChatAdmin, Long> {
    List<GroupChatAdmin> findByGroupChatId(Long groupChatId);
    Optional<GroupChatAdmin> findByGroupChatIdAndUserId(Long groupChatId, Long userId);
    boolean existsByGroupChatIdAndUserId(Long groupChatId, Long userId);
    void deleteByGroupChatIdAndUserId(Long groupChatId, Long userId);
}