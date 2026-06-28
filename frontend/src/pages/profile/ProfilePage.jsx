import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bookmark, Heart, Lock, MessageCircle, Play, UserSquare2 } from "lucide-react";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import GettingStarted from "../../components/profile/GettingStarted";

import ProfileHighlights from "../../components/profile/ProfileHighlights";
import FollowersModal from "../../components/profile/FollowersModal";
import ProfileNote from "../../components/profile/ProfileNote";
import ImmersivePostModal from "../../components/ImmersivePostModal";
import CreatePostModal from "../../components/CreatePostModal";

import { getSavedPosts } from "../../api/savedPostsApi";
import { getTaggedPosts } from "../../api/tagsApi";
import { getPosts } from "../../api/postsApi";
import { getCurrentUser, getUser, searchUsers, updateProfilePicture } from "../../api/userApi";
import { getFollowersCount, getFollowingCount, isFollowingUser } from "../../api/followApi";
import { clearCurrentUserCache, useCurrentUser } from "../../hooks/useCurrentUser";

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

const isPrivateProfile = (profileUser) =>
  Boolean(profileUser?.isPrivate ?? profileUser?.private);

function ProfilePage() {
  const { currentUserId } = useCurrentUser();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedImmersivePost, setSelectedImmersivePost] = useState(null);
  const [followModalType, setFollowModalType] = useState(null);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);

  const fileInputRef = useRef(null);

  const [searchParams] = useSearchParams();
  const params = useParams();
  const profileUsername = searchParams.get("username");
  const profileUserId = params.userId || searchParams.get("userId");
  const isOwnProfile =
    (!profileUserId && !profileUsername) ||
    (profileUserId && currentUserId && String(profileUserId) === String(currentUserId));

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

      const ownsLoadedProfile =
        currentUserId && String(profileUserWithCounts.id) === String(currentUserId);

      let following = false;
      if (!ownsLoadedProfile && profileUserWithCounts?.id) {
        try {
          following = await isFollowingUser(profileUserWithCounts.id);
          setIsFollowingProfile(following);
        } catch {
          setIsFollowingProfile(false);
        }
      } else {
        setIsFollowingProfile(false);
      }

      const isPrivateAndBlocked = !ownsLoadedProfile && isPrivateProfile(profileUserWithCounts) && !following;

      if (!isPrivateAndBlocked) {
        const allPosts = await getPosts(profileUserWithCounts.id);
        const normalizedPosts = Array.isArray(allPosts)
          ? allPosts
          : allPosts?.content || [];

        const userPosts = normalizedPosts.filter((post) =>
            postBelongsToUser(post, profileUserWithCounts)
        );

        setPosts(userPosts);
      } else {
        setPosts([]);
      }

      if (ownsLoadedProfile) {
        try {
          const saved = await getSavedPosts();
          const normalizedSaved = Array.isArray(saved) ? saved : saved?.content || [];
          setSavedPosts(normalizedSaved);
        } catch (_error) {
          setSavedPosts([]);
        }
      } else {
        setSavedPosts([]);
      }

      if (!isPrivateAndBlocked) {
        try {
          const tagged = await getTaggedPosts(profileUserWithCounts.id);
          const normalizedTagged = Array.isArray(tagged) ? tagged : tagged?.content || [];
          setTaggedPosts(normalizedTagged);
        } catch (_error) {
          setTaggedPosts([]);
        }
      } else {
        setTaggedPosts([]);
      }
    } catch (_error) {
      setUser(null);
      setPosts([]);
      setSavedPosts([]);
      setTaggedPosts([]);
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

      clearCurrentUserCache();
      setUser(updatedUser);
      await loadProfile();
    } catch (_error) {
    } finally {
      event.target.value = "";
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    setActiveTab("posts");
    loadProfile();
  }, [profileUserId, profileUsername, currentUserId]);

  const visiblePosts =
    activeTab === "saved" ? savedPosts : activeTab === "tagged" ? taggedPosts : posts;
  const viewingOwnProfile =
    isOwnProfile || (currentUserId && user?.id && String(user.id) === String(currentUserId));
  const privateAndNotAllowed = isPrivateProfile(user) && !viewingOwnProfile && !isFollowingProfile;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-secondary border-t-primary" />
          <p className="mt-4 text-sm text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card">
        <p className="text-sm text-secondary">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <main className="min-h-screen px-4 pb-[72px] pt-0 md:px-8">
        <div className="mx-auto max-w-[935px]">

        <ProfileHeader
          user={user}
          postsCount={posts.length}
          isOwnProfile={viewingOwnProfile}
          onProfilePhotoClick={viewingOwnProfile ? () => fileInputRef.current?.click() : undefined}
          onFollowersClick={() => setFollowModalType("followers")}
          onFollowingClick={() => setFollowModalType("following")}
          noteSlot={<ProfileNote user={user} isOwnProfile={viewingOwnProfile} />}
        />

          <ProfileHighlights user={user} isOwnProfile={viewingOwnProfile} />

          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showSaved={viewingOwnProfile}
            showTagged={viewingOwnProfile || !isPrivateProfile(user) || isFollowingProfile}
          />

          {privateAndNotAllowed ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center border-t border-primary py-16 text-center">
              <div className="rounded-full border border-primary p-4">
                <Lock className="h-10 w-10 text-secondary" />
              </div>
              <p className="mt-4 text-lg font-bold text-primary">This account is private</p>
              <p className="mt-2 text-sm text-secondary">Follow this account to see their photos and videos.</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            activeTab === "saved" && viewingOwnProfile ? (
              <div className="py-16 text-center">
                <Bookmark className="mx-auto h-12 w-12 text-secondary" />
                <p className="mt-4 text-lg font-bold text-primary">No Saved Posts</p>
                <p className="mt-2 text-sm text-secondary">Posts you save will appear here.</p>
              </div>
            ) : activeTab === "tagged" ? (
              <div className="py-16 text-center">
                <UserSquare2 className="mx-auto h-12 w-12 text-secondary" />
                <p className="mt-4 text-lg font-bold text-primary">No Tagged Posts</p>
                <p className="mt-2 text-sm text-secondary">When people tag you in posts, they will appear here.</p>
              </div>
            ) : viewingOwnProfile ? (
              user?.profilePicture && user?.bio ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-secondary">No posts yet</p>
                </div>
              ) : (
                <GettingStarted
                  onSharePhoto={() => setCreateOpen(true)}
                  onAddProfilePhoto={() => fileInputRef.current?.click()}
                  showProfilePhotoCard={!user?.profilePicture}
                />
              )
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-secondary">No posts yet</p>
              </div>
            )
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
                    className="group relative aspect-square cursor-pointer overflow-hidden bg-tertiary"
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
                      {(!post.hideLikeCount || viewingOwnProfile) && (
                        <span className="flex items-center gap-2">
                          <Heart size={20} fill="currentColor" />
                          {likeCount}
                        </span>
                      )}

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
          onClose={() => setSelectedImmersivePost(null)}
          onRefresh={loadProfile}
          onPostUpdated={loadProfile}
        />
      )}

      {followModalType && (
        <FollowersModal
          user={user}
          type={followModalType}
          currentUserId={currentUserId}
          onClose={() => setFollowModalType(null)}
          onFollowChanged={loadProfile}
        />
      )}
    </div>
  );
}

export default ProfilePage;
