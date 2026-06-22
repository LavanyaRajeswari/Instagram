import { useEffect, useState } from "react";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { getSavedPosts } from "../api/savedPostsApi";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const firstMedia = (post) => post.media?.[0]?.mediaUrl || null;

function SavedPosts() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedPosts()
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-[935px] px-4 py-8 pb-[82px] md:pb-10">
      <h1 className="mb-6 text-2xl font-bold text-[#262626]">Saved</h1>
      {loading ? (
        <p className="py-16 text-center text-sm text-gray-500">Loading saved posts...</p>
      ) : posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">No saved posts yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {posts.map((post) => {
            const mediaUrl = firstMedia(post);
            if (!mediaUrl) return null;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square overflow-hidden bg-gray-100"
              >
                {isVideoUrl(mediaUrl) ? (
                  <video src={mediaUrl} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt={post.caption || "Saved post"} className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedPost && (
        <ImmersivePostModal
          post={selectedPost}
          postsList={posts}
          onClose={() => setSelectedPost(null)}
          onPostUpdated={(updatedPost) => {
            setPosts((prev) =>
              prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post))
            );
            setSelectedPost((prev) =>
              prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev
            );
          }}
          onSelectPost={setSelectedPost}
        />
      )}
    </main>
  );
}

export default SavedPosts;
