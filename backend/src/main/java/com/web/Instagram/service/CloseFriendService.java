package com.web.Instagram.service;

import com.web.Instagram.dto.closeFriend.CloseFriendResponse;
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
@Transactional
public class CloseFriendService {

    private final CloseFriendRepository closeFriendRepository;
    private final UserRepository userRepository;

    public void addCloseFriend(Long ownerId, Long friendId) {

        if (ownerId.equals(friendId)) {
            throw new RuntimeException("You cannot add yourself as a close friend.");
        }

        User owner = getUserOrThrow(ownerId);
        User friend = getUserOrThrow(friendId);

        if (closeFriendRepository.existsByOwnerAndFriend(owner, friend)) {
            throw new RuntimeException("Already a close friend.");
        }

        closeFriendRepository.save(
                CloseFriend.builder()
                        .owner(owner)
                        .friend(friend)
                        .build()
        );
    }

    public void removeCloseFriend(Long ownerId, Long friendId) {
        User owner = getUserOrThrow(ownerId);
        User friend = getUserOrThrow(friendId);
        closeFriendRepository.deleteByOwnerAndFriend(owner, friend);
    }

    public boolean isCloseFriend(Long ownerId, Long friendId) {
        User owner = getUserOrThrow(ownerId);
        User friend = getUserOrThrow(friendId);
        return closeFriendRepository.existsByOwnerAndFriend(owner, friend);
    }

    public List<CloseFriendResponse> getCloseFriends(Long ownerId) {
        User owner = getUserOrThrow(ownerId);
        return closeFriendRepository.findByOwner(owner)
                .stream()
                .map(CloseFriend::getFriend)
                .map(user -> CloseFriendResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .profilePicture(user.getProfilePicture())
                        .build())
                .toList();
    }


    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}