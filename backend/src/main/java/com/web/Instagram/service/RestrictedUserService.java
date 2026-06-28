package com.web.Instagram.service;

import com.web.Instagram.entity.RestrictedUser;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.RestrictedUserRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestrictedUserService {

    private final RestrictedUserRepository restrictedUserRepository;
    private final UserRepository userRepository;

    @Transactional
    public void restrictUser(Long restricterId, Long restrictedId) {
        if (restricterId.equals(restrictedId)) {
            throw new RuntimeException("Cannot restrict yourself");
        }
        if (restrictedUserRepository.existsByRestricterIdAndRestrictedId(restricterId, restrictedId)) return;
        User restricter = userRepository.findById(restricterId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        User restricted = userRepository.findById(restrictedId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        RestrictedUser ru = RestrictedUser.builder()
            .restricter(restricter)
            .restricted(restricted)
            .build();
        restrictedUserRepository.save(ru);
    }

    @Transactional
    public void unRestrictUser(Long restricterId, Long restrictedId) {
        restrictedUserRepository.deleteByRestricterIdAndRestrictedId(restricterId, restrictedId);
    }

    public List<RestrictedUser> getRestrictedUsers(Long restricterId) {
        return restrictedUserRepository.findByRestricterId(restricterId);
    }
}
