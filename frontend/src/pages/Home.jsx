import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { getPosts } from "../api/postsApi";
import StoriesBar from "../components/StoriesBar";

function Home() {
  const [posts, setPosts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImmersivePost, setSelectedImmersivePost] = useState(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getPosts();
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
  }, []);

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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar onCreateClick={() => setCreateOpen(true)} />

      {/* Main layout container */}
      <main className="flex justify-center gap-[64px] px-4 md:px-8 py-8 pb-[82px] md:pb-10 transition-all duration-300" id="feed-layout">        {/* Feed column */}
        <section className="w-full max-w-[470px]" id="feed-column">
          <StoriesBar />

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
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                onMediaClick={(p) => setSelectedImmersivePost(p)}
              />
            ))}
        </section>
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
          onPostUpdated={handlePostUpdated}
          onSelectPost={(p) => setSelectedImmersivePost(p)}
        />
      )}
    </div>
  );
}

export default Home;
