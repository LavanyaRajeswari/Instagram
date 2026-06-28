package com.web.Instagram.service;

import com.web.Instagram.entity.Post;
import com.web.Instagram.entity.Share;
import com.web.Instagram.entity.User;
import com.web.Instagram.repository.PostRepository;
import com.web.Instagram.repository.ShareRepository;
import com.web.Instagram.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Transactional
    public long sharePost(Long senderId, Long postId, Long receiverId, String shareType) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User receiver = null;
        if (receiverId != null) {
            receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));
        }

        Share share = new Share();
        share.setSender(sender);
        share.setReceiver(receiver);
        share.setPost(post);
        share.setShareType(shareType == null ? "COPY_LINK" : shareType);
        share.setTargetType("POST");

        shareRepository.save(share);

        return shareRepository.countByPostId(postId);
    }

    @Transactional
    public long shareStory(Long senderId, Long storyId, Long receiverId, String shareType) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = null;
        if (receiverId != null) {
            receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));
        }

        Share share = new Share();
        share.setSender(sender);
        share.setReceiver(receiver);
        share.setStoryId(storyId);
        share.setShareType(shareType == null ? "COPY_LINK" : shareType);
        share.setTargetType("STORY");

        shareRepository.save(share);

        return shareRepository.countByStoryId(storyId);
    }

    public long getShareCount(Long postId) {
        return shareRepository.countByPostId(postId);
    }

    public long getStoryShareCount(Long storyId) {
        return shareRepository.countByStoryId(storyId);
    }
}