import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { getPosts } from "../api/postsApi";

function Home() {
  const [posts, setPosts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImmersivePost, setSelectedImmersivePost] = useState(null);

  // Active user details
  const [currentUser, setCurrentUser] = useState(() => {
    const cachedUser = localStorage.getItem("currentUser");
    return cachedUser ? JSON.parse(cachedUser) : {
      id: 1,
      username: "lavanya",
      fullName: "Lavanya",
      profilePicture: "https://i.pravatar.cc/100?img=5"
    };
  });

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getPosts(currentUser?.id || 1);
      console.log("Backend Posts:", data);
      setPosts(data);
    } catch (error) {
      console.error("Failed to load posts", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar onCreateClick={() => setCreateOpen(true)} />

      {/* Main layout container */}
      <main className="md:ml-[72px] xl:ml-[244px] flex justify-center gap-[64px] px-4 md:px-8 py-8 pb-[82px] md:pb-10 transition-all duration-300" id="feed-layout">
        {/* Feed column */}
        <section className="w-full max-w-[470px]" id="feed-column">
          {/* Stories bar */}
          <div className="flex gap-4 overflow-x-auto border border-[#dbdbdb] bg-white p-4.5 rounded-xl mb-6 scrollbar-none" id="stories-bar">
            {[
              "Your Story",
              "lavanya",
              "sam",
              "mountblue",
              "java_dev",
            ].map((name, index) => (
              <div className="w-[66px] flex flex-col items-center text-center text-[11px] text-gray-800 font-normal cursor-pointer select-none shrink-0" key={name}>
                <img
                  src={name === "lavanya" ? currentUser.profilePicture : `https://i.pravatar.cc/100?img=${index + 10}`}
                  alt={name}
                  className="w-[56px] h-[56px] rounded-full p-[1.5px] border-2 border-[#e1306c] object-cover mb-1 hover:scale-105 transition-transform"
                />
                <span className="truncate max-w-full leading-tight">{name}</span>
              </div>
            ))}
          </div>

          {/* Load indicators */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20" id="loading-spinner">
              <div className="border-[3px] border-[#efefef] border-t-[#0095f6] rounded-full w-8 h-8 animate-spin"></div>
              <p className="text-gray-500 text-xs font-semibold mt-4">Loading posts...</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-[#dbdbdb] rounded-xl bg-white p-8" id="empty-feed">
              <p className="text-gray-500 font-semibold text-sm">No posts found</p>
              <button 
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-xs font-semibold text-[#0095f6] hover:text-[#005f9e]"
              >
                Create your first post
              </button>
            </div>
          )}

          {/* Posts list */}
          {!loading &&
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onRefresh={loadPosts}
                onMediaClick={(p) => setSelectedImmersivePost(p)}
              />
            ))}
        </section>

        {/* Suggestions Column (Desktop only) */}
        <aside className="w-[320px] pt-4 hidden lg:block self-start shrink-0 sticky top-8" id="suggestions-column">
          {/* Active profile shortcut */}
          <div className="flex items-center gap-3 mb-5 justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.profilePicture || "https://i.pravatar.cc/100?img=5"}
                alt="profile"
                className="w-11 h-11 rounded-full object-cover border border-gray-100"
              />
              <div className="min-w-0">
                <h4 className="m-0 text-[13.5px] font-bold text-[#262626] leading-snug cursor-pointer">{currentUser.username || "lavanya"}</h4>
                <p className="m-0 text-[12px] text-gray-500 truncate leading-none mt-0.5">{currentUser.fullName || "Lavanya"}</p>
              </div>
            </div>
            <button className="text-[#0095f6] font-semibold text-xs hover:text-[#005f9e]">Switch</button>
          </div>

          {/* Suggestions header */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[13px] font-bold text-gray-500 leading-none">
              Suggestions for you
            </h4>
            <button className="text-xs font-bold text-gray-800 hover:opacity-60 leading-none">See All</button>
          </div>

          {/* Suggestion list */}
          <div className="flex flex-col gap-4">
            {[
              "springboot_dev",
              "react_ui",
              "cloudinary_app",
            ].map((user, i) => (
              <div className="flex items-center gap-3" key={user}>
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 20}`}
                  alt={user}
                  className="w-8.5 h-8.5 rounded-full object-cover border border-gray-50"
                />
                <div className="min-w-0 flex-grow">
                  <h5 className="m-0 text-[13px] font-bold text-[#262626] leading-tight truncate">{user}</h5>
                  <p className="m-0 text-[11px] text-gray-400 mt-0.5 leading-none">Suggested for you</p>
                </div>
                <button className="text-[#0095f6] hover:text-[#005f9e] font-bold text-[11px] ml-auto">Follow</button>
              </div>
            ))}
          </div>

          {/* Footer labels */}
          <footer className="mt-8 text-[11px] text-gray-300 leading-normal" id="suggestions-footer">
            <p className="hover:underline cursor-pointer">About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language</p>
            <p className="mt-4 uppercase">© 2026 INSTAGRAM FROM META</p>
          </footer>
        </aside>
      </main>

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => {
            setCreateOpen(false);
            loadPosts();
          }}
        />
      )}

      {selectedImmersivePost && (
        <ImmersivePostModal
          post={selectedImmersivePost}
          postsList={posts}
          onClose={() => setSelectedImmersivePost(null)}
          onRefresh={loadPosts}
          onSelectPost={(p) => setSelectedImmersivePost(p)}
        />
      )}
    </div>
  );
}

export default Home;
