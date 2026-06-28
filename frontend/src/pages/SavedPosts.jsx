import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
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
      <h1 className="mb-6 text-2xl font-bold text-primary">Saved</h1>
      {loading ? (
        <p className="py-16 text-center text-sm text-secondary">Loading saved posts...</p>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <Bookmark className="mx-auto h-12 w-12 text-secondary" />
          <p className="mt-4 text-lg font-bold text-primary">No Saved Posts</p>
          <p className="mt-2 text-sm text-secondary">Posts you save will appear here.</p>
        </div>
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
                className="relative aspect-square overflow-hidden bg-tertiary"
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
          onClose={() => setSelectedPost(null)}
          onPostUpdated={(updatedPost) => {
            setPosts((prev) => {
              if (updatedPost.isSaved === false) {
                return prev.filter((post) => post.id !== updatedPost.id);
              }
              return prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post));
            });
            setSelectedPost((prev) =>
              prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev
            );
          }}
        />
      )}
    </main>
  );
}

export default SavedPosts;
