import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Heart, MessageCircle, Send, Play } from "lucide-react";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import GettingStarted from "../../components/profile/GettingStarted";
import ProfileFooter from "../../components/profile/ProfileFooter";
import ProfileHighlights from "../../components/profile/ProfileHighlights";
import ImmersivePostModal from "../../components/ImmersivePostModal";
import CreatePostModal from "../../components/CreatePostModal";

import { getSavedPosts } from "../../api/savedPostsApi";
import { getLikeCount } from "../../api/likesApi";
import { getCommentCount } from "../../api/commentsApi";
import { getPosts } from "../../api/postsApi";
import { getCurrentUser, getUser, searchUsers, updateProfilePicture } from "../../api/userApi";

import { getFollowersCount, getFollowingCount } from "../../api/followApi";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const getPostMediaUrl = (post) =>
  post.media?.[0]?.mediaUrl ||
  post.imageUrls?.[0] ||
  post.mediaUrl ||
  post.imageUrl ||
  post.images?.[0]?.imageUrl ||
  post.images?.[0] ||
  null;

const postBelongsToUser = (post, user) => {
  if (!user) return false;

  const username = user.username?.toLowerCase();

  return (
    post.user?.id === user.id ||
    post.userId === user.id ||
    post.user?.username?.toLowerCase() === username ||
    post.username?.toLowerCase() === username
  );
};

const addCountsToPosts = async (posts) => {
  return Promise.all(
    posts.map(async (post) => {
      try {
        const [likeCount, commentCount] = await Promise.all([
          getLikeCount(post.id),
          getCommentCount(post.id),
        ]);

        return { ...post, likeCount, commentCount };
      } catch {
        return {
          ...post,
          likeCount: post.likeCount ?? 0,
          commentCount: post.commentCount ?? 0,
        };
      }
    })
  );
};

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedImmersivePost, setSelectedImmersivePost] = useState(null);

  const fileInputRef = useRef(null);

  const [searchParams] = useSearchParams();
  const params = useParams();
  const profileUsername = searchParams.get("username");
  const profileUserId = params.userId || searchParams.get("userId");
  const isOwnProfile = !profileUserId && !profileUsername;

  const loadProfile = async () => {
    try {
      setLoading(true);

      let profileUser;
      if (profileUserId) {
        profileUser = await getUser(profileUserId);
      } else if (profileUsername) {
        const users = await searchUsers(profileUsername);
        profileUser = (Array.isArray(users) ? users : []).find(
          (item) => item.username?.toLowerCase() === profileUsername.toLowerCase()
        );
        if (!profileUser) throw new Error("User not found");
      } else {
        profileUser = await getCurrentUser();
      }

      const [followersCount, followingCount] = await Promise.all([
        getFollowersCount(profileUser.id),
        getFollowingCount(profileUser.id),
      ]);

      const profileUserWithCounts = {
        ...profileUser,
        followersCount,
        followingCount,
      };

      setUser(profileUserWithCounts);

      const allPosts = await getPosts(profileUserWithCounts.id);
      const normalizedPosts = Array.isArray(allPosts)
        ? allPosts
        : allPosts?.content || [];

      const userPosts = normalizedPosts.filter((post) =>
          postBelongsToUser(post, profileUserWithCounts)
      );

      const postsWithCounts = await addCountsToPosts(userPosts);
      setPosts(postsWithCounts);

      const saved = await getSavedPosts(profileUserWithCounts.id);
      const normalizedSaved = Array.isArray(saved) ? saved : saved?.content || [];
      const savedWithCounts = await addCountsToPosts(normalizedSaved);
      setSavedPosts(savedWithCounts);
    } catch (error) {
      console.error("Failed to load profile", error);
      setUser(null);
      setPosts([]);
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploadingPhoto(true);

      const updatedUser = await updateProfilePicture({
        userId: user.id,
        profilePicture: file,
      });

      setUser(updatedUser);
      await loadProfile();
    } catch (error) {
      console.error("Failed to upload profile photo", error);
      alert("Profile photo upload failed");
    } finally {
      event.target.value = "";
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [profileUserId, profileUsername]);

  const visiblePosts =
    activeTab === "saved" ? savedPosts : activeTab === "tagged" ? [] : posts;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-[#dbdbdb] border-t-black" />
          <p className="mt-4 text-sm text-[#737373]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="min-h-screen px-4 pb-[72px] pt-0 md:px-8">
        <div className="mx-auto max-w-[935px]">
        <ProfileHeader
          user={user}
          postsCount={posts.length}
          onProfilePhotoClick={isOwnProfile ? () => fileInputRef.current?.click() : undefined}
        />

          <ProfileHighlights user={user} isOwnProfile={isOwnProfile} />

          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {visiblePosts.length === 0 ? (
            <GettingStarted
              onSharePhoto={() => setCreateOpen(true)}
              onAddProfilePhoto={isOwnProfile ? () => fileInputRef.current?.click() : undefined}
            />
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-[2px] md:gap-1">
              {visiblePosts.map((post) => {
                const mediaUrl = getPostMediaUrl(post);
                const likeCount =
                  post.likeCount ?? post.likesCount ?? post.likes?.length ?? 0;
                const commentCount =
                  post.commentCount ??
                  post.commentsCount ??
                  post.comments?.length ??
                  0;

                return (
                  <button
                    key={post.id}
                    type="button"
                    className="group relative aspect-square cursor-pointer overflow-hidden bg-[#efefef]"
                    onClick={() => setSelectedImmersivePost(post)}
                  >
                    {mediaUrl ? (
                      isVideoUrl(mediaUrl) ? (
                        <>
                          <video
                            src={mediaUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                          <Play
                            size={22}
                            fill="white"
                            className="absolute right-2 top-2 text-white"
                          />
                        </>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={post.caption || "post"}
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8e8e8e]">
                        <MessageCircle size={32} />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/35 font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      <span className="flex items-center gap-2">
                        <Heart size={20} fill="currentColor" />
                        {likeCount}
                      </span>

                      <span className="flex items-center gap-2">
                        <MessageCircle size={20} fill="currentColor" />
                        {commentCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <ProfileFooter />
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploadingPhoto}
        onChange={handleProfilePhotoChange}
      />

      <button
        type="button"
        className="fixed bottom-7 right-[30px] z-30 hidden h-[52px] min-w-[226px] items-center gap-3 rounded-full border border-[#dbdbdb] bg-white px-[18px] text-[15px] font-bold text-[#262626] shadow-sm transition hover:bg-[#f7f7f7] lg:flex"
      >
        <Send size={24} strokeWidth={2.2} />
        Messages
      </button>

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => {
            setCreateOpen(false);
            loadProfile();
          }}
        />
      )}

      {selectedImmersivePost && (
        <ImmersivePostModal
          post={selectedImmersivePost}
          postsList={visiblePosts}
          onClose={() => setSelectedImmersivePost(null)}
          onRefresh={loadProfile}
          onPostUpdated={loadProfile}
          onSelectPost={(post) => setSelectedImmersivePost(post)}
        />
      )}
    </div>
  );
}

export default ProfilePage;
