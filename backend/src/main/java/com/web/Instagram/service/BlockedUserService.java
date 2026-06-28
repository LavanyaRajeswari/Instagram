package com.web.Instagram.service;

import com.web.Instagram.entity.BlockedUser;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.BlockedUserRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockedUserService {

    private final BlockedUserRepository blockedUserRepository;
    private final UserRepository userRepository;

    @Transactional
    public void blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new RuntimeException("Cannot block yourself");
        }
        if (blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) return;
        User blocker = userRepository.findById(blockerId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        User blocked = userRepository.findById(blockedId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        BlockedUser blockedUser = BlockedUser.builder()
            .blocker(blocker)
            .blocked(blocked)
            .build();
        blockedUserRepository.save(blockedUser);
    }

    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        blockedUserRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    public boolean isBlocked(Long blockerId, Long blockedId) {
        return blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    public List<BlockedUser> getBlockedUsers(Long blockerId) {
        return blockedUserRepository.findByBlockerId(blockerId);
    }
}