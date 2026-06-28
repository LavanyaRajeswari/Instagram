import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { getFeedPosts } from "../api/postsApi";
import { useFeedQuery } from "../api/queryHooks";
import StoriesBar from "../components/StoriesBar";
import { getSuggestedUsers } from "../api/userApi";
import { followUser, unfollowUser, isFollowingUser } from "../api/followApi";
import { getAvatarUrl } from "../utils/avatar";
import { useCurrentUser } from "../hooks/useCurrentUser";

function PostSkeleton() {
  return (
    <div className="mb-6 rounded-lg border border-primary bg-card animate-pulse">
      <div className="flex items-center gap-3 p-4">
        <div className="h-8 w-8 rounded-full bg-tertiary" />
        <div className="h-4 w-24 rounded bg-tertiary" />
      </div>
      <div className="aspect-square bg-tertiary" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-16 rounded bg-tertiary" />
        <div className="h-4 w-48 rounded bg-tertiary" />
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { currentUserId, currentUser } = useCurrentUser();
  const [posts, setPosts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImmersivePost, setSelectedImmersivePost] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const sentinelRef = useRef(null);
  const firstFeedQuery = useFeedQuery({ page: 0, size: 10 });

  const loadPosts = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      const data = await getFeedPosts({ page: pageNum, size: 10 });
      const newPosts = Array.isArray(data) ? data : [];
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setHasMore(newPosts.length === 10);
      setPage(pageNum);
    } catch (err) {
      setError(err?.message || "Failed to load posts");
      if (pageNum === 0) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (firstFeedQuery.isLoading) {
      setLoading(true);
      return;
    }
    if (firstFeedQuery.error) {
      setError(firstFeedQuery.error?.message || "Failed to load posts");
      setPosts([]);
      setLoading(false);
      return;
    }
    if (firstFeedQuery.data) {
      const newPosts = Array.isArray(firstFeedQuery.data) ? firstFeedQuery.data : [];
      setPosts(newPosts);
      setHasMore(newPosts.length === 10);
      setPage(0);
      setLoading(false);
      setError(null);
    }
  }, [firstFeedQuery.data, firstFeedQuery.error, firstFeedQuery.isLoading]);

  useEffect(() => {
    if (!currentUserId) return;
    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const users = await getSuggestedUsers();
        const list = Array.isArray(users) ? users.filter((u) => String(u.id) !== String(currentUserId)) : [];
        setSuggestedUsers(list.slice(0, 5));
        const map = {};
        for (const u of list.slice(0, 5)) {
          try { map[u.id] = await isFollowingUser(u.id); } catch { map[u.id] = false; }
        }
        setFollowingMap(map);
      } catch { setSuggestedUsers([]); }
      finally { setSuggestionsLoading(false); }
    };
    loadSuggestions();
  }, [currentUserId]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadPosts(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, loadPosts]);

  const handleFollowSuggestion = async (userId) => {
    try {
      if (followingMap[userId]) {
        await unfollowUser(userId);
        setFollowingMap((prev) => ({ ...prev, [userId]: false }));
      } else {
        await followUser(userId);
        setFollowingMap((prev) => ({ ...prev, [userId]: true }));
      }
    } catch {}
  };

  const handlePostUpdated = (updatedPost, meta = {}) => {
    setPosts((prev) =>
      meta.reposted
        ? [
            meta.reposted,
            ...prev.map((item) => (item.id === updatedPost.id ? { ...item, ...updatedPost } : item)),
          ]
        : prev.map((item) => (item.id === updatedPost.id ? { ...item, ...updatedPost } : item))
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
    <div className="min-h-screen bg-secondary">
      <main className="flex justify-center gap-[64px] px-4 md:px-8 py-8 pb-[82px] md:pb-10 transition-all duration-300" id="feed-layout">
        <section className="w-full max-w-[580px]" id="feed-column">
          <StoriesBar />

          {loading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {error && !loading && (
            <div className="text-center py-20 border border-dashed border-primary rounded-xl bg-card p-8">
              <p className="text-secondary font-semibold text-sm mb-3">{error}</p>
              <button
                onClick={() => loadPosts(0, false)}
                className="text-xs font-semibold text-[#0095f6] hover:text-[#005f9e]"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-primary rounded-xl bg-card p-8" id="empty-feed">
              <p className="text-secondary font-semibold text-sm">No posts found</p>
              <p className="text-secondary text-xs mt-1">Follow some users to see their posts here</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-xs font-semibold text-[#0095f6] hover:text-[#005f9e]"
              >
                Create your first post
              </button>
            </div>
          )}

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

          {loadingMore && (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {hasMore && !loading && <div ref={sentinelRef} className="h-4" />}
        </section>

        <aside className="hidden xl:block w-[320px] shrink-0" id="suggestions-column">
          <div className="fixed w-[320px]">
            {currentUser && (
              <div className="flex items-center gap-3 mb-4">
                <button type="button" onClick={() => navigate("/profile")} className="shrink-0">
                  <img src={getAvatarUrl(currentUser)} alt="" className="h-11 w-11 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary">{currentUser.username}</p>
                  <p className="truncate text-xs text-secondary">{currentUser.fullName || ""}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-secondary">Suggested for you</p>
              <button type="button" onClick={() => {
                if (!currentUserId) return;
                setSuggestionsLoading(true);
                getSuggestedUsers().then((users) => {
                  const list = Array.isArray(users) ? users.filter((u) => String(u.id) !== String(currentUserId)) : [];
                  setSuggestedUsers(list.slice(0, 5));
                }).catch(() => {}).finally(() => setSuggestionsLoading(false));
              }} className="text-xs font-semibold text-primary hover:text-secondary">
                Refresh
              </button>
            </div>

            {suggestionsLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-secondary border-t-[#0095f6] mx-auto" />
            ) : (
              <div className="space-y-2">
                {suggestedUsers.map((user) => {
                  const isFollowing = followingMap[user.id];
                  return (
                    <div key={user.id} className="flex items-center gap-3">
                      <button type="button" onClick={() => navigate(`/profile/${user.id}`)} className="shrink-0">
                        <img src={getAvatarUrl(user)} alt="" className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => navigate(`/profile/${user.id}`)} className="truncate text-sm font-semibold text-primary">
                          {user.username}
                        </button>
                        {user.followedBy && (
                          <p className="truncate text-xs text-secondary">Followed by {user.followedBy}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFollowSuggestion(user.id)}
                        className={`shrink-0 text-xs font-semibold ${isFollowing ? "text-primary" : "text-[#0095f6]"}`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
                {!suggestionsLoading && suggestedUsers.length === 0 && (
                  <p className="text-xs text-secondary">No suggestions available</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => {
            setCreateOpen(false);
            loadPosts(0, false);
          }}
        />
      )}

      {selectedImmersivePost && (
        <ImmersivePostModal
          post={selectedImmersivePost}
          onClose={() => setSelectedImmersivePost(null)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}

export default Home;
