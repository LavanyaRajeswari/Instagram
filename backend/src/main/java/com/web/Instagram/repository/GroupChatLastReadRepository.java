package com.web.Instagram.repository;

import com.web.Instagram.entity.GroupChatLastRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupChatLastReadRepository extends JpaRepository<GroupChatLastRead, Long> {

    Optional<GroupChatLastRead> findByGroupChatIdAndUserId(Long groupChatId, Long userId);

    @Query("select r from GroupChatLastRead r where r.user.id = :userId and r.groupChat.id in :groupIds")
    List<GroupChatLastRead> findByUserIdAndGroupChatIdIn(@Param("userId") Long userId, @Param("groupIds") List<Long> groupIds);
}
