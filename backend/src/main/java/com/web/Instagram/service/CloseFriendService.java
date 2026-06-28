package com.web.Instagram.service;

import com.web.Instagram.entity.CloseFriend;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.CloseFriendRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CloseFriendService {

    private final CloseFriendRepository closeFriendRepository;
    private final UserRepository userRepository;

    public List<CloseFriend> getCloseFriends(Long userId) {
        return closeFriendRepository.findByUserId(userId);
    }

    @Transactional
    public void addCloseFriend(Long userId, Long friendId) {
        if (userId.equals(friendId)) {
            throw new RuntimeException("Cannot add yourself");
        }
        if (closeFriendRepository.existsByUserIdAndFriendId(userId, friendId)) return;
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        User friend = userRepository.findById(friendId)
            .orElseThrow(() -> new RuntimeException("Friend not found"));
        CloseFriend closeFriend = CloseFriend.builder()
            .user(user)
            .friend(friend)
            .build();
        closeFriendRepository.save(closeFriend);
    }

    @Transactional
    public void removeCloseFriend(Long userId, Long friendId) {
        closeFriendRepository.deleteByUserIdAndFriendId(userId, friendId);
    }

    public boolean isCloseFriend(Long userId, Long friendId) {
        return closeFriendRepository.existsByUserIdAndFriendId(userId, friendId);
    }
}