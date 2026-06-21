import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ImmersivePostModal from "../components/ImmersivePostModal";
import CreatePostModal from "../components/CreatePostModal";
import { getPosts } from "../api/postsApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAvatarUrl } from "../utils/avatar";

function Profile() {
  const {
    currentUser,
    currentUserId: CURRENT_USER_ID,
    currentUserLoading,
  } = useCurrentUser();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedImmersivePost, setSelectedImmersivePost] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);

      if (currentUserLoading) {
        return;
      }

      if (!CURRENT_USER_ID || !currentUser) {
        setUser(null);
        setPosts([]);
        return;
      }

      let allPosts = [];

      try {
        allPosts = await getPosts(CURRENT_USER_ID);
      } catch (err) {
        console.warn("Backend posts api offline");
        allPosts = [];
      }

      // Filter post items matching active user credentials
      const userPosts = allPosts.filter(
        (post) =>
          post.user?.id === CURRENT_USER_ID ||
          post.user?.username?.toLowerCase() === currentUser.username?.toLowerCase() ||
          post.username?.toLowerCase() === currentUser.username?.toLowerCase()
      );

      setUser(currentUser);
      setPosts(userPosts);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [CURRENT_USER_ID, currentUserLoading]);

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((item) => (item.id === updatedPost.id ? { ...item, ...updatedPost } : item))
    );
    setSelectedImmersivePost((prev) =>
      prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((item) => item.id !== postId));
    setSelectedImmersivePost((prev) => (prev?.id === postId ? null : prev));
  };

  if (loading) {
    return (
      <div className="bg-[#fafafa] min-h-screen">
        <Sidebar onCreateClick={() => setCreateOpen(true)} />
        <main className="md:ml-[72px] xl:ml-[244px] flex flex-col items-center justify-center py-40" id="profile-loading">
          <div className="border-[3px] border-[#efefef] border-t-[#0095f6] rounded-full w-8 h-8 animate-spin"></div>
          <h2 className="text-gray-500 text-sm font-semibold mt-4">Loading profile...</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen">
      <Sidebar onCreateClick={() => setCreateOpen(true)} />

      <main className="md:ml-[72px] xl:ml-[244px] max-w-[935px] mx-auto px-4 md:px-8 py-10 pb-[80px] md:pb-10 transition-all duration-300" id="profile-layout">
        {!user ? (
          <div className="text-center py-20 text-gray-400 font-medium text-sm">
            Profile unavailable
          </div>
        ) : (
          <>
        {/* Profile Header section */}
        <header className="flex flex-col md:flex-row gap-6 md:gap-20 items-center md:items-start text-center md:text-left mb-10 pb-4 border-b border-gray-100 md:border-none" id="profile-header">
          {/* Avatar frame */}
          <div className="flex-shrink-0" id="profile-photo-frame">
            <img
              className="w-[96px] h-[96px] md:w-[150px] md:h-[150px] rounded-full object-cover border border-[#dbdbdb] p-1 bg-white"
              src={getAvatarUrl(user)}
              alt="profile"
            />
          </div>

          {/* Profile details block */}
          <div className="flex-grow min-w-0 flex flex-col gap-5 w-full" id="profile-details-column">
            {/* Top info line */}
            <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap" id="profile-info-row-1">
              <h2 className="text-[20px] font-normal text-[#262626] leading-none m-0 mr-3 truncate" id="profile-username">
                {user?.username}
              </h2>
              <button className="bg-[#efefef] hover:bg-[#e2e2e2] text-[#262626] font-semibold text-[13.5px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer mr-1">
                Edit profile
              </button>
              <button className="bg-[#efefef] hover:bg-[#e2e2e2] text-[#262626] font-semibold text-[13.5px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer mr-1">
                View archive
              </button>
              <button className="text-[18px] text-[#262626] font-semibold p-1 hover:opacity-60 transition-opacity focus:outline-none leading-none cursor-pointer">
                ⚙
              </button>
            </div>

            {/* Profile Statistics counts */}
            <div className="flex gap-6 md:gap-9 justify-center md:justify-start text-sm border-t border-b border-gray-100 md:border-none py-3 md:py-0 w-full" id="profile-stats-row">
              <p className="m-0 text-gray-500 md:text-[#262626]">
                <strong className="text-[#262626] font-semibold">{posts.length}</strong> posts
              </p>
            </div>

            {/* Biography */}
            <div className="text-sm text-[#262626] leading-relaxed" id="profile-bio-box">
              <h4 className="font-semibold text-[14.5px] m-0 mb-1">{user?.fullName}</h4>
              <p className="m-0 text-gray-700 whitespace-pre-wrap">{user?.bio}</p>
            </div>
          </div>
        </header>

        {/* Categories Tabs bar */}
        <div className="border-t border-[#dbdbdb] flex justify-center gap-12" id="profile-tabs-bar">
          <button className="py-4 border-t-2 border-black -mt-[1px] font-bold text-[12px] tracking-widest text-[#262626] flex items-center gap-2 cursor-pointer">
            ▦ POSTS
          </button>
          <button className="py-4 border-t-2 border-transparent font-semibold text-[12px] tracking-widest text-gray-400 hover:text-black hover:border-black transition-all flex items-center gap-2 cursor-pointer">
            SAVED
          </button>
          <button className="py-4 border-t-2 border-transparent font-semibold text-[12px] tracking-widest text-gray-400 hover:text-black hover:border-black transition-all flex items-center gap-2 cursor-pointer">
            👤 TAGGED
          </button>
        </div>

        {/* Posts visual grid layout */}
        <section className="grid grid-cols-3 gap-1 md:gap-7 mt-6" id="profile-grid">
          {posts.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-gray-400 font-medium text-sm" id="empty-posts-alert">
              No posts yet
            </div>
          ) : (
            posts.map((post) => {
              const media = post.media?.[0];
              if (!media?.mediaUrl) return null;

              return (
                <div
                  key={post.id}
                  className="relative aspect-square bg-[#fafafa] overflow-hidden group rounded-sm border border-gray-100 shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
                  onClick={() => setSelectedImmersivePost(post)}
                >
                  {media.mediaType?.toUpperCase() === "VIDEO" ? (
                    <video src={media.mediaUrl} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" muted playsInline />
                  ) : (
                    <img src={media.mediaUrl} alt="post item" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                  )}
                  {/* Subtle hover details screen */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white text-[15px] font-bold transition-opacity h-full w-full">
                    <span className="flex items-center gap-1.5">❤️ {post.likeCount || 0}</span>
                    <span className="flex items-center gap-1.5">💬 {post.commentCount || post.commentsCount || post.totalComments || 0}</span>
                  </div>
                </div>
              );
            })
          )}
        </section>
          </>
        )}
      </main>

      {selectedImmersivePost && (
        <ImmersivePostModal
          post={selectedImmersivePost}
          postsList={posts}
          onClose={() => setSelectedImmersivePost(null)}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
          onSelectPost={(p) => setSelectedImmersivePost(p)}
        />
      )}

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => {
            setCreateOpen(false);
            loadProfile();
          }}
        />
      )}
    </div>
  );
}

export default Profile;
