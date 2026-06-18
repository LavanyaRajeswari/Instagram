package com.web.Instagram.service;

import com.web.Instagram.entity.User;
import com.web.Instagram.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    public User register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User updatedUser) {

        User user = getUser(id);

        if (updatedUser.getFullName() != null) {
            user.setFullName(updatedUser.getFullName());
        }

        if (updatedUser.getBio() != null) {
            user.setBio(updatedUser.getBio());
        }

        if (updatedUser.getProfilePicture() != null) {
            user.setProfilePicture(updatedUser.getProfilePicture());
        }

        user.setIsPrivate(updatedUser.getIsPrivate());
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.delete(getUser(id));
    }

    public ResponseEntity<List<User>> getAllUSers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}