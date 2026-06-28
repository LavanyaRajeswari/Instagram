import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { getHashtagCount, getHashtagPosts } from "../api/hashtagsApi";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const getPostMedia = (post) =>
  post.media?.[0]?.mediaUrl ||
  post.imageUrls?.[0] ||
  post.mediaUrl ||
  post.imageUrl ||
  null;

function HashtagPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [postData, postCount] = await Promise.all([
          getHashtagPosts(tag),
          getHashtagCount(tag),
        ]);
        setPosts(Array.isArray(postData) ? postData : []);
        setCount(postCount);
      } catch {
        setPosts([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tag]);

  return (
    <main className="min-h-screen bg-card px-4 py-8">
      <section className="mx-auto max-w-[935px]">
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary text-4xl font-light">
            #
          </div>
          <div>
            <h1 className="text-3xl font-light">#{tag}</h1>
            <p className="mt-1 text-sm font-semibold">{count} posts</p>
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-secondary">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-secondary">No posts found for this hashtag.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {posts.map((post) => {
              const mediaUrl = getPostMedia(post);
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
                    <img src={mediaUrl} alt={post.caption || "post"} className="h-full w-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedPost && (
        <ImmersivePostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostUpdated={(updatedPost) => {
            setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)));
            setSelectedPost((prev) => (prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev));
          }}
        />
      )}
    </main>
  );
}

export default HashtagPage;
