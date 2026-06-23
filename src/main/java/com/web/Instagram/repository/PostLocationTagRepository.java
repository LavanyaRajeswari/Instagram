package com.web.Instagram.repository;

import com.web.Instagram.entity.PostLocationTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostLocationTagRepository extends JpaRepository<PostLocationTag, Long> {
    List<PostLocationTag> findByPostId(Long postId);
    void deleteByPostId(Long postId);
    List<PostLocationTag> findByNameContainingIgnoreCase(String name);
    long countByName(String name);
}