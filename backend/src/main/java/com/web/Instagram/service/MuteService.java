package com.web.Instagram.service;

import com.web.Instagram.entity.Mute;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.MuteRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MuteService {

    private final MuteRepository muteRepository;
    private final UserRepository userRepository;

    @Transactional
    public void muteUser(Long userId, Long mutedUserId, String muteType) {
        if (userId.equals(mutedUserId)) {
            throw new RuntimeException("Cannot mute yourself");
        }
        if (muteRepository.existsByUserIdAndMutedUserIdAndMuteType(userId, mutedUserId, muteType)) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User muted = userRepository.findById(mutedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Mute mute = Mute.builder()
                .user(user)
                .mutedUser(muted)
                .muteType(muteType)
                .build();
        muteRepository.save(mute);
    }

    @Transactional
    public void unmuteUser(Long userId, Long mutedUserId) {
        muteRepository.deleteByUserIdAndMutedUserId(userId, mutedUserId);
    }

    public boolean isMuted(Long userId, Long mutedUserId, String muteType) {
        return muteRepository.existsByUserIdAndMutedUserIdAndMuteType(userId, mutedUserId, muteType);
    }

    public List<Mute> getUserMutes(Long userId) {
        return muteRepository.findByUserId(userId);
    }
}