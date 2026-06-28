package com.web.Instagram.repository;

import com.web.Instagram.entity.ProfileLink;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfileLinkRepository extends JpaRepository<ProfileLink, Long> {
    List<ProfileLink> findByUserIdOrderByCreatedAtAsc(Long userId);
    void deleteByUserId(Long userId);
}