package com.web.Instagram.repository;

import com.web.Instagram.entity.Story;
import com.web.Instagram.entity.StoryReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoryReplyRepository extends JpaRepository<StoryReply, Long> {
    List<StoryReply> findByStoryOrderByCreatedAtAsc(Story story);
}