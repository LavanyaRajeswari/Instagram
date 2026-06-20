package com.web.Instagram.repository;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    long countByUser(User user);
}