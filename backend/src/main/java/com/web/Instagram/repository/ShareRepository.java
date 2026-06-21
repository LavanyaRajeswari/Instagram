package com.web.Instagram.repository;

import com.web.Instagram.entity.Share;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShareRepository extends JpaRepository<Share, Long> {

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);
}
