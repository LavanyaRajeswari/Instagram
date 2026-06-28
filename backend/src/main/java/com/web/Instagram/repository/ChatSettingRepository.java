package com.web.Instagram.repository;

import com.web.Instagram.entity.ChatSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatSettingRepository extends JpaRepository<ChatSetting, Long> {
    Optional<ChatSetting> findByUserIdAndChatId(Long userId, Long chatId);
    Optional<ChatSetting> findByUserIdAndGroupChatId(Long userId, Long groupChatId);
}