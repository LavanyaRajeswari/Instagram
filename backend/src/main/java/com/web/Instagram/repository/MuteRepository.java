package com.web.Instagram.repository;

import com.web.Instagram.entity.Mute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MuteRepository extends JpaRepository<Mute, Long> {
    Optional<Mute> findByUserIdAndMutedUserIdAndMuteType(Long userId, Long mutedUserId, String muteType);
    boolean existsByUserIdAndMutedUserIdAndMuteType(Long userId, Long mutedUserId, String muteType);
    List<Mute> findByUserId(Long userId);
    void deleteByUserIdAndMutedUserId(Long userId, Long mutedUserId);
}