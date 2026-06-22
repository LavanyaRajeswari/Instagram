# Backend API Mapping

Base URL used by the frontend: `VITE_API_BASE_URL` or `http://localhost:8080/api`.
Protected calls use `Authorization: Bearer <token>` from `sessionStorage.instagram_auth_token`.

| Feature | Controller file | Endpoint | Method | Request body / params | Response shape | Frontend file |
|---|---|---:|---|---|---|---|
| Login | `UserRestController.java` | `/api/users/login` | POST | JSON `{ login, password }` | `LoginResponse { id, username, fullName, profilePicture, token }` | `src/api/authApi.js`, `src/api/userApi.js` |
| Register | `UserRestController.java` | `/api/users/register` | POST | JSON `{ username, fullName, email?, mobileNumber?, password, birthDate? }` | `LoginResponse` | `src/api/authApi.js`, `src/api/userApi.js` |
| Current user | `UserRestController.java` | `/api/users/me` | GET | Bearer token | `UserResponse { id, username, fullName, email, bio, gender, profilePicture, website, isPrivate, isVerified, postsCount, followersCount, followingCount, lastActiveAt }` | `src/hooks/useCurrentUser.js`, `src/api/userApi.js` |
| User profile | `UserRestController.java` | `/api/users/{id}` | GET | Path `id` | `UserResponse` | `src/api/userApi.js`, `src/pages/profile/ProfilePage.jsx` |
| Search users | `UserRestController.java` | `/api/users/search` | GET | Query `query` | `UserResponse[]` | `src/api/userApi.js`, `src/pages/Search.jsx`, `src/api/messagesApi.js` |
| Suggested users | `UserRestController.java` | `/api/users/suggested` | GET | Query `limit=20` | `UserResponse[]` | `src/api/userApi.js` |
| Edit profile | `UserRestController.java` | `/api/users/profile` | PUT | JSON `UpdateRequest { fullName?, username?, bio?, gender?, website?, email?, profilePicture?, isPrivate }` | `UserResponse` | `src/api/userApi.js`, `src/pages/profile/EditProfilePage.jsx` |
| Profile picture | `UserRestController.java` | `/api/users/profile-picture` | PUT | Multipart `profilePicture` | `UserResponse` | `src/api/userApi.js`, `src/pages/profile/ProfilePage.jsx`, `src/pages/profile/EditProfilePage.jsx` |
| Home feed | `PostRestController.java` | `/api/posts/feed` | GET | Pageable query `page`, `size`, `sort?` | `Page<PostResponse>` with `content[]` | `src/api/postsApi.js`, `src/pages/Home.jsx` |
| All posts fallback | `PostRestController.java` | `/api/posts` | GET | Pageable query | `Page<PostResponse>` | `src/api/postsApi.js` |
| User posts | `PostRestController.java` | `/api/posts/user/{userId}` | GET | Path `userId`, pageable query | `Page<PostResponse>` | `src/api/postsApi.js`, `src/pages/profile/ProfilePage.jsx` |
| Explore posts | `PostRestController.java` | `/api/posts/explore` | GET | Pageable query | `Page<PostResponse>` | `src/api/postsApi.js`, `src/pages/Search.jsx` |
| Search posts | `PostRestController.java` | `/api/posts/search` | GET | Query `query`, pageable query | `Page<PostResponse>` | `src/api/postsApi.js`, `src/pages/Search.jsx` |
| Post details | `PostRestController.java` | `/api/posts/{id}` | GET | Path `id` | `PostResponse { id, caption, createdAt, likeCount, commentCount, user, media[] }` | `src/api/postsApi.js` |
| Create post | `PostRestController.java` | `/api/posts` | POST | Multipart `caption?`, `images[]` | `PostResponse` | `src/api/postsApi.js`, `src/components/CreatePostModal.jsx` |
| Edit post | `PostRestController.java` | `/api/posts/{id}` | PUT | Multipart `caption?`, `images[]?` | `PostResponse` | `src/api/postsApi.js`, `src/components/PostCard.jsx` |
| Update caption | `PostRestController.java` | `/api/posts/{id}/caption` | PUT | Query `caption` | `PostResponse` | `src/api/postsApi.js` |
| Delete post | `PostRestController.java` | `/api/posts/{id}` | DELETE | Path `id` | Empty body | `src/api/postsApi.js`, `src/components/PostCard.jsx` |
| Post comments | `CommentRestController.java` | `/api/posts/{postId}/comments` | GET | Path `postId` | `CommentResponse[]` | `src/api/commentsApi.js`, `src/components/PostCard.jsx` |
| Add comment | `CommentRestController.java` | `/api/posts/{postId}/comments` | POST | Query `text` | `CommentResponse` | `src/api/commentsApi.js`, `src/components/PostCard.jsx` |
| Add reply | `CommentRestController.java` | `/api/posts/{postId}/comments/{parentCommentId}/replies` | POST | Query `text` | `CommentResponse` | `src/api/commentsApi.js` |
| Comment replies | `CommentRestController.java` | `/api/posts/comments/{commentId}/replies` | GET | Path `commentId` | `CommentResponse[]` | `src/api/commentsApi.js` |
| Delete comment | `CommentRestController.java` | `/api/posts/{postId}/comments/{commentId}` or `/api/posts/comments/{commentId}` | DELETE | Path ids | Empty body | `src/api/commentsApi.js` |
| Like comment | `CommentRestController.java` | `/api/posts/comments/{commentId}/like` | POST/DELETE | Path `commentId` | Empty body | `src/api/commentsApi.js` |
| Comment like status/count | `CommentRestController.java` | `/api/posts/comments/{commentId}/like/status`, `/likes` | GET | Path `commentId` | `boolean` or `Long` | `src/api/commentsApi.js` |
| Like post | `LikeRestController.java` | `/api/posts/{postId}/like` | POST/DELETE | Path `postId` | Empty body | `src/api/likesApi.js`, `src/components/PostCard.jsx` |
| Post like status/count/users | `LikeRestController.java` | `/api/posts/{postId}/like/status`, `/likes`, `/likes/users` | GET | Path `postId` | `boolean`, `Long`, or `UserResponse[]` | `src/api/likesApi.js` |
| Save post | `SavedPostRestController.java` | `/api/posts/{postId}/save` | POST/DELETE | Path `postId` | Empty body | `src/api/savedPostsApi.js` |
| Saved status | `SavedPostRestController.java` | `/api/posts/{postId}/save/status` | GET | Path `postId` | `boolean` | `src/api/savedPostsApi.js` |
| Saved posts | `SavedPostRestController.java` | `/api/posts/saved` | GET | Bearer token | `PostResponse[]` | `src/api/savedPostsApi.js`, `src/pages/SavedPosts.jsx` |
| Share post | `ShareRestController.java` | `/api/posts/{postId}/share` | POST | Query `receiverId?`, `shareType=COPY_LINK` | `Long` share id/count | `src/api/shareApi.js`, `src/components/ShareModal.jsx` |
| Share count | `ShareRestController.java` | `/api/posts/{postId}/shares` | GET | Path `postId` | `Long` | `src/api/shareApi.js` |
| Stories bar/viewer | `StoryRestController.java` | `/api/stories` | GET | Bearer token | `StoryResponse[]` | `src/api/storiesApi.js`, `src/components/StoriesBar.jsx`, `src/components/StoryViewer.jsx` |
| Create story | `StoryRestController.java` | `/api/stories` | POST | Multipart `caption?`, `media` | `StoryResponse` | `src/api/storiesApi.js`, `src/components/CreateStoryModal.jsx` |
| Story like/status/count | `StoryRestController.java` | `/api/stories/{storyId}/like`, `/liked`, `/likes` | POST/DELETE/GET | Path `storyId` | Empty body, `boolean`, or `Long` | `src/api/storiesApi.js` |
| Story reply/views/delete | `StoryRestController.java` | `/api/stories/{storyId}/reply`, `/replies`, `/view`, `/views`, `/views/count`, `/{storyId}` | POST/GET/DELETE | Path `storyId`, query `text` for reply | `StoryReply`, `StoryReply[]`, `StoryView[]`, `Long`, or empty | `src/api/storiesApi.js` |
| Reels | `ReelsRestController.java` | `/api/reels` | GET | Query `page=0`, `size=10` | `Page<PostResponse>` where media is video | `src/api/reelsApi.js`, `src/pages/Reels.jsx` |
| Follow/unfollow | `FollowRestController.java` | `/api/users/{followingId}/follow` | POST/DELETE | Path `followingId` | Empty body | `src/api/followApi.js` |
| Follow status | `FollowRestController.java` | `/api/users/{followingId}/follow/status` | GET | Path `followingId` | `boolean` | `src/api/followApi.js` |
| Followers/following | `FollowRestController.java` | `/api/users/{userId}/followers`, `/following` | GET | Path `userId`, pageable query | `Page<UserResponse>` | `src/api/followApi.js` |
| Follower counts | `FollowRestController.java` | `/api/users/{userId}/followers/count`, `/following/count` | GET | Path `userId` | `Long` | `src/api/followApi.js`, `src/pages/profile/ProfilePage.jsx` |
| Chats | `ChatRestController.java` | `/api/chats` | GET | Bearer token | `ChatDto[]` | `src/api/messagesApi.js`, `src/pages/Messages.jsx` |
| Start chat | `ChatRestController.java` | `/api/chats/start/{userId}` | POST | Path `userId` | `ChatDto { id, otherUserId, username, profilePicture, lastMessage, lastMessageAt, unreadCount, online }` | `src/api/messagesApi.js` |
| Chat messages | `MessageRestController.java` | `/api/messages/{chatId}` | GET | Path `chatId`, query `page=0`, `size=30` | `Page<MessageDto>` with `content[]` | `src/api/messagesApi.js` |
| Send message | `MessageRestController.java` | `/api/messages` | POST | JSON `{ chatId, content }` | `MessageDto { id, senderId, content, seen, createdAt }` | `src/api/messagesApi.js`, `src/pages/Messages.jsx` |
| Mark messages seen | `MessageRestController.java` | `/api/messages/{chatId}/seen` | PUT | Path `chatId` | String `"Messages marked as seen"` | `src/api/messagesApi.js` |
| Chat WebSocket support | `ChatSocketRestController.java`, `WebSocketConfig.java` | `/ws`, `/app/chat.send`, `/app/chat.typing`, `/topic/chat/{chatId}` | STOMP | `SendMessageRequest`, `TypingDto` | `MessageDto`, `TypingDto` | REST implemented in `src/pages/Messages.jsx` |
| Notifications | `NotificationRestController.java` | `/api/notifications` | GET | Bearer token | `NotificationResponse[]` | `src/api/notificationsApi.js`, `src/pages/Notifications.jsx` |
| Notification unread | `NotificationRestController.java` | `/api/notifications/unread` | GET | Bearer token | `{ count: Long }` | `src/api/notificationsApi.js` |
| Mark notifications seen | `NotificationRestController.java` | `/api/notifications/{id}/seen`, `/seen/all` | PUT | Path `id` or Bearer token | Empty body | `src/api/notificationsApi.js` |
| Hashtag posts | `HashtagRestController.java` | `/api/hashtags/{tag}/posts` | GET | Path `tag`, query `page`, `size` | `Page<PostResponse>` | Future explore/search integration |
| Trending hashtags | `HashtagRestController.java` | `/api/hashtags/trending` | GET | Query `limit=10` | `String[]` | Future explore sidebar |
| Collections | `CollectionRestController.java` | `/api/collections` and `/api/collections/{collectionId}/posts/{postId}` | GET/POST/DELETE | JSON `{ name }` for create, path ids for post operations | `Collection` or `Collection[]` | Future saved collections UI |
