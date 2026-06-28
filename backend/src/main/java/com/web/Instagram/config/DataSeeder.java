package com.web.Instagram.config;

import com.web.Instagram.entity.*;
import com.web.Instagram.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final MediaRepository mediaRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final StoryRepository storyRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final GroupChatRepository groupChatRepository;
    private final GroupChatMessageRepository groupChatMessageRepository;
    private final GroupChatAdminRepository groupChatAdminRepository;
    private final HashtagRepository hashtagRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded, skipping.");
            return;
        }

        log.info("Seeding database...");

        User alice = createUser("alice", "Alice Johnson", "alice@example.com", "password123", false, false);
        User bob = createUser("bob", "Bob Smith", "bob@example.com", "password123", false, false);
        User charlie = createUser("charlie", "Charlie Brown", "charlie@example.com", "password123", false, false);
        User diana = createUser("diana", "Diana Prince", "diana@example.com", "password123", true, true);

        Post alicePost = createPost(alice, "Beautiful sunset today! #sunset #nature", "PUBLIC", false, false);
        Post bobPost = createPost(bob, "My new painting #art", "PUBLIC", false, false);
        Post charliePost = createPost(charlie, "Game day! #sports", "PUBLIC", false, false);

        createMedia(alicePost, "https://picsum.photos/seed/sunset/600/600", MediaType.IMAGE, "seed_sunset", 1);
        createMedia(bobPost, "https://picsum.photos/seed/painting/600/600", MediaType.IMAGE, "seed_painting", 1);
        createMedia(charliePost, "https://picsum.photos/seed/game/600/600", MediaType.IMAGE, "seed_game", 1);

        createLike(alice, bobPost);
        createLike(alice, charliePost);
        createLike(bob, alicePost);
        createLike(charlie, alicePost);

        Comment comment1 = createComment(bob, alicePost, "Amazing view!");
        Comment comment2 = createComment(charlie, alicePost, "Where is this?");
        Comment comment3 = createComment(alice, bobPost, "Love your art!");
        Comment comment4 = createComment(bob, comment2, "I'd like to know too!");

        createCommentLike(alice, comment1);

        createFollow(alice, bob);
        createFollow(bob, alice);
        createFollow(alice, charlie);
        createFollow(diana, alice);

        createFollowRequest(charlie, diana);

        createStory(alice, "https://picsum.photos/seed/story/600/600", "IMAGE", null);

        Chat chat = createChat(alice, bob);
        createMessage(chat, alice, "Hey Bob! How are you?", "TEXT");
        createMessage(chat, bob, "I'm great! Check out my new painting.", "TEXT");
        createMessage(chat, alice, "It's beautiful!", "TEXT");

        GroupChat groupChat = createGroupChat("Friends", "A group for close friends", alice, List.of(alice, bob, charlie));
        createGroupChatAdmin(groupChat, alice);
        createGroupMessage(groupChat, alice, "Welcome to the group!");
        createGroupMessage(groupChat, bob, "Hey everyone!");

        createHashtag("#sunset", alicePost.getId());
        createHashtag("#nature", alicePost.getId());
        createHashtag("#art", bobPost.getId());
        createHashtag("#sports", charliePost.getId());

        createNotification(alice, bob, "COMMENT", "Bob commented on your post", bobPost.getId(), comment1.getId());
        createNotification(alice, charlie, "LIKE", "Charlie liked your post", alicePost.getId(), null);

        log.info("Database seeded successfully with {} records.", countAll());
    }

    private long countAll() {
        return userRepository.count() + postRepository.count() + mediaRepository.count()
                + likeRepository.count() + commentRepository.count() + commentLikeRepository.count()
                + followRepository.count() + followRequestRepository.count() + storyRepository.count()
                + chatRepository.count() + messageRepository.count() + groupChatRepository.count()
                + groupChatMessageRepository.count() + groupChatAdminRepository.count()
                + hashtagRepository.count() + notificationRepository.count();
    }

    private User createUser(String username, String fullName, String email, String rawPassword,
                            boolean isPrivate, boolean isVerified) {
        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setBio("Hi, I'm " + fullName);
        user.setGender("unspecified");
        user.setBirthDate(LocalDate.of(1995, 1, 1));
        user.setIsPrivate(isPrivate);
        user.setIsVerified(isVerified);
        user.setRole("USER");
        user.setAccountStatus("ACTIVE");
        return userRepository.save(user);
    }

    private Post createPost(User user, String caption, String visibility,
                            boolean hideLikeCount, boolean commentsDisabled) {
        Post post = new Post();
        post.setUser(user);
        post.setCaption(caption);
        post.setVisibility(visibility);
        post.setHideLikeCount(hideLikeCount);
        post.setCommentsDisabled(commentsDisabled);
        return postRepository.save(post);
    }

    private void createMedia(Post post, String mediaUrl, MediaType mediaType, String publicId, int sortOrder) {
        Media media = new Media();
        media.setPost(post);
        media.setMediaUrl(mediaUrl);
        media.setMediaType(mediaType);
        media.setPublicId(publicId);
        media.setSortOrder(sortOrder);
        mediaRepository.save(media);
    }

    private void createLike(User user, Post post) {
        Like like = new Like();
        like.setUser(user);
        like.setPost(post);
        likeRepository.save(like);
    }

    private Comment createComment(User user, Post post, String text) {
        Comment comment = new Comment();
        comment.setUser(user);
        comment.setPost(post);
        comment.setText(text);
        return commentRepository.save(comment);
    }

    private Comment createComment(User user, Comment parent, String text) {
        Comment comment = new Comment();
        comment.setUser(user);
        comment.setPost(parent.getPost());
        comment.setParentComment(parent);
        comment.setText(text);
        return commentRepository.save(comment);
    }

    private void createCommentLike(User user, Comment comment) {
        CommentLike commentLike = new CommentLike();
        commentLike.setUser(user);
        commentLike.setComment(comment);
        commentLikeRepository.save(commentLike);
    }

    private void createFollow(User follower, User following) {
        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        followRepository.save(follow);
    }

    private void createFollowRequest(User follower, User following) {
        FollowRequest request = FollowRequest.builder()
                .follower(follower)
                .following(following)
                .status("PENDING")
                .build();
        followRequestRepository.save(request);
    }

    private void createStory(User user, String mediaUrl, String mediaType, String caption) {
        Story story = Story.builder()
                .user(user)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .caption(caption)
                .build();
        storyRepository.save(story);
    }

    private Chat createChat(User userOne, User userTwo) {
        Chat chat = new Chat();
        chat.setUserOne(userOne);
        chat.setUserTwo(userTwo);
        return chatRepository.save(chat);
    }

    private void createMessage(Chat chat, User sender, String content, String messageType) {
        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(content);
        message.setMessageType(messageType);
        messageRepository.save(message);
    }

    private GroupChat createGroupChat(String name, String description, User createdBy, List<User> members) {
        GroupChat groupChat = GroupChat.builder()
                .name(name)
                .description(description)
                .createdBy(createdBy)
                .members(members)
                .build();
        return groupChatRepository.save(groupChat);
    }

    private void createGroupChatAdmin(GroupChat groupChat, User user) {
        GroupChatAdmin admin = GroupChatAdmin.builder()
                .groupChat(groupChat)
                .user(user)
                .build();
        groupChatAdminRepository.save(admin);
    }

    private void createGroupMessage(GroupChat groupChat, User sender, String content) {
        GroupChatMessage message = GroupChatMessage.builder()
                .groupChat(groupChat)
                .sender(sender)
                .content(content)
                .messageType("TEXT")
                .build();
        groupChatMessageRepository.save(message);
    }

    private void createHashtag(String tag, Long postId) {
        Hashtag hashtag = Hashtag.builder()
                .tag(tag)
                .postId(postId)
                .build();
        hashtagRepository.save(hashtag);
    }

    private void createNotification(User recipient, User sender, String type,
                                    String text, Long postId, Long commentId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .text(text)
                .postId(postId)
                .commentId(commentId)
                .build();
        notificationRepository.save(notification);
    }
}
