import { useEffect, useRef, useState } from "react";
import { Clock, Hash, Search as SearchIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { getSuggestedUsers, searchUsers } from "../api/userApi";
import { getExplorePosts, searchPosts } from "../api/postsApi";
import { getTrendingHashtags, searchHashtags } from "../api/hashtagsApi";
import { api } from "../api/client";
import { getAvatarUrl } from "../utils/avatar";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

function Search({ onCreateClick }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [explorePosts, setExplorePosts] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [hashtagResults, setHashtagResults] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [explorePage, setExplorePage] = useState(0);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoadingMore, setExploreLoadingMore] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const exploreSentinelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadExplorePosts();
    loadTrendingHashtags();
    loadSuggestedUsers();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUserResults([]);
      setPostResults([]);
      setHashtagResults([]);
      return;
    }
    const timer = setTimeout(() => runSearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadExplorePosts = async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setExploreLoading(true);
      else setExploreLoadingMore(true);
      const data = await getExplorePosts({ page: pageNum, size: 20 });
      const newPosts = Array.isArray(data) ? data : [];
      if (append) {
        setExplorePosts((prev) => [...prev, ...newPosts]);
      } else {
        setExplorePosts(newPosts);
      }
      setExploreHasMore(newPosts.length === 20);
      setExplorePage(pageNum);
    } catch {
      if (pageNum === 0) setExplorePosts([]);
    } finally {
      setExploreLoading(false);
      setExploreLoadingMore(false);
    }
  };

  const loadSuggestedUsers = async () => {
    try {
      const users = await getSuggestedUsers();
      setSuggestedUsers(Array.isArray(users) ? users.slice(0, 6) : []);
    } catch {
      setSuggestedUsers([]);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const data = await getTrendingHashtags(10);
      setTrendingHashtags(data);
    } catch {
      setTrendingHashtags([]);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const { data } = await api.get("/users/search-history");
      setSearchHistory(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setSearchHistory([]);
    }
  };

  const saveToSearchHistory = async (q, type = "USER", targetId = null) => {
    try {
      await api.post("/users/search-history", { query: q, type, targetId });
      loadSearchHistory();
    } catch {}
  };

  const clearSearchHistory = async () => {
    const previous = searchHistory;
    setSearchHistory([]);
    try {
      await api.delete("/users/search-history");
      await loadSearchHistory();
    } catch {
      setSearchHistory(previous);
    }
  };

  useEffect(() => {
    if (!exploreSentinelRef.current || !exploreHasMore || query.trim() || exploreLoading || exploreLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && exploreHasMore && !exploreLoadingMore) {
          loadExplorePosts(explorePage + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(exploreSentinelRef.current);
    return () => observer.disconnect();
  }, [exploreHasMore, query, exploreLoading, exploreLoadingMore, explorePage]);

  const runSearch = async (value) => {
    try {
      setLoading(true);
      const [users, posts, hashtags] = await Promise.all([
        searchUsers(value),
        searchPosts(value),
        searchHashtags(value).catch(() => []),
      ]);
      setUserResults(Array.isArray(users) ? users : []);
      setPostResults(Array.isArray(posts) ? posts : []);
      setHashtagResults(Array.isArray(hashtags) ? hashtags : []);
    } catch {
      setUserResults([]);
      setPostResults([]);
      setHashtagResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPostMedia = (post) => {
    if (Array.isArray(post.media) && post.media.length > 0) return post.media[0]?.mediaUrl;
    if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) return post.imageUrls[0];
    return null;
  };

  const handleUserClick = (user) => {
    setQuery("");
    setSearchFocused(false);
    saveToSearchHistory(user.username, "USER", user.id);
    navigate(`/profile/${user.id}`);
  };

  const handleHashtagClick = (tag) => {
    const normalizedTag = String(tag).replace(/^#/, "");
    setQuery("");
    setSearchFocused(false);
    saveToSearchHistory(`#${normalizedTag}`, "HASHTAG");
    navigate(`/hashtags/${normalizedTag}`);
  };

  const handleRecentSearchClick = (item) => {
    if (item.type === "USER" && item.targetId) {
      setSearchFocused(false);
      navigate(`/profile/${item.targetId}`);
    } else if (item.type === "HASHTAG") {
      setSearchFocused(false);
      navigate(`/hashtags/${String(item.query || "").replace(/^#/, "")}`);
    } else {
      setQuery(item.query || "");
      inputRef.current?.focus();
    }
  };

  const showDropdown = searchFocused && !query.trim() && (searchHistory.length > 0);
  const showResults = searchFocused && query.trim();

  const hasAnyResults = userResults.length > 0 || postResults.length > 0 || hashtagResults.length > 0;

  return (
    <div className="min-h-screen bg-card">
      <main className="min-h-screen">
        <section className="mx-auto max-w-[935px] px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-5 text-2xl font-bold text-primary">Search</h1>

            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
              <input
                ref={inputRef}
                value={query}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-11 w-full rounded-lg bg-tertiary pl-12 pr-11 text-sm text-primary outline-none placeholder:text-secondary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-secondary p-1"
                >
                  <X className="h-3 w-3 text-primary" />
                </button>
              )}
            </div>
          </div>

          {showDropdown && (
            <div className="mb-6 rounded-xl border border-primary bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-primary px-4 py-3">
                <h2 className="text-sm font-bold text-primary">Recent searches</h2>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={clearSearchHistory}
                  className="text-xs font-semibold text-[#0095f6] hover:text-[#005f9e]"
                >
                  Clear all
                </button>
              </div>
              <div>
                {searchHistory.map((item, i) => (
                  <button
                    key={item.id || i}
                    type="button"
                    onClick={() => handleRecentSearchClick(item)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-secondary" />
                    <span className="text-sm text-primary">{item.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showResults && (
            <div className="mb-8 rounded-xl border border-primary bg-card shadow-sm">
              <div className="border-b border-primary px-4 py-3">
                <h2 className="text-sm font-bold text-primary">Search results</h2>
              </div>

              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-secondary">Searching...</p>
              ) : !hasAnyResults ? (
                <p className="px-4 py-8 text-center text-sm text-secondary">No results found for "{query}"</p>
              ) : (
                <div>
                  {userResults.length > 0 && (
                    <div>
                      {userResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleUserClick(user);
                          }}
                          onClick={() => handleUserClick(user)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
                        >
                          <img
                            src={getAvatarUrl(user)}
                            alt={user.username}
                            className="h-11 w-11 rounded-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-primary">{user.username}</p>
                            <p className="truncate text-xs text-secondary">{user.fullName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {hashtagResults.length > 0 && (
                    <div className={userResults.length > 0 ? "border-t border-primary" : ""}>
                      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-secondary uppercase tracking-wide">Hashtags</p>
                      {hashtagResults.map((tag, i) => {
                        const normalizedTag = String(tag).replace(/^#/, "");
                        return (
                          <button
                            key={`hashtag-${normalizedTag}-${i}`}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleHashtagClick(tag);
                            }}
                            onClick={() => handleHashtagClick(tag)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary text-xl font-light shrink-0">
                              #
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-primary">#{normalizedTag}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {postResults.length > 0 && (
                    <div className={(userResults.length > 0 || hashtagResults.length > 0) ? "border-t border-primary" : ""}>
                      <p className="px-4 pt-3 pb-2 text-xs font-semibold text-secondary uppercase tracking-wide">Posts</p>
                      <div className="grid grid-cols-3 gap-1 px-4 pb-4">
                        {postResults.slice(0, 9).map((post) => {
                          const mediaUrl = getPostMedia(post);
                          if (!mediaUrl) return null;
                          return (
                            <button
                              key={post.id}
                              type="button"
                              onClick={() => {
                                setQuery("");
                                setSearchFocused(false);
                                navigate(`/post/${post.id}`);
                              }}
                              className="relative aspect-square overflow-hidden rounded bg-tertiary"
                            >
                              {isVideoUrl(mediaUrl) ? (
                                <>
                                  <video
                                    src={mediaUrl}
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                  />
                                  <span className="absolute right-1 top-1 text-xs font-bold text-white drop-shadow">▶</span>
                                </>
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={post.caption || "post"}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!query.trim() && trendingHashtags.length > 0 && (
            <div className="mb-8 rounded-xl border border-primary bg-card shadow-sm">
              <div className="border-b border-primary px-4 py-3">
                <h2 className="text-sm font-bold text-primary">Trending hashtags</h2>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {trendingHashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate(`/hashtags/${String(tag).replace(/^#/, "")}`)}
                    className="flex items-center gap-1 rounded-full border border-primary px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
                  >
                    <Hash className="h-3.5 w-3.5 text-secondary" />
                    {String(tag).replace(/^#/, "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!query.trim() && suggestedUsers.length > 0 && (
            <div className="mb-8 rounded-xl border border-primary bg-card shadow-sm">
              <div className="border-b border-primary px-4 py-3">
                <h2 className="text-sm font-bold text-primary">Suggested creators</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3">
                {suggestedUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleUserClick(user);
                    }}
                    onClick={() => handleUserClick(user)}
                    className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-secondary"
                  >
                    <img
                      src={getAvatarUrl(user)}
                      alt={user.username}
                      className="h-16 w-16 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                    />
                    <p className="truncate text-sm font-semibold text-primary">{user.username}</p>
                    {user.fullName && (
                      <p className="truncate text-xs text-secondary">{user.fullName}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-base font-bold text-primary">
              {query.trim() ? "More posts" : "Explore"}
            </h2>

            {exploreLoading && !query.trim() ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-tertiary animate-pulse rounded" />
                ))}
              </div>
            ) : explorePosts.length === 0 && !query.trim() ? (
              <p className="py-16 text-center text-sm text-secondary">No posts found</p>
            ) : !query.trim() ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {explorePosts.map((post) => {
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
                        <>
                          <video
                            src={mediaUrl}
                            muted
                            playsInline
                            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                          />
                          <span className="absolute right-2 top-2 text-xs font-bold text-white drop-shadow">▶</span>
                        </>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={post.caption || "post"}
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {exploreLoadingMore && !query.trim() && (
              <p className="py-8 text-center text-sm text-secondary">Loading more...</p>
            )}

            {!query.trim() && exploreHasMore && !exploreLoading && (
              <div ref={exploreSentinelRef} className="h-4" />
            )}
          </div>
        </section>
      </main>

      {selectedPost && (
        <ImmersivePostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostUpdated={(updatedPost) => {
            setExplorePosts((prev) =>
              prev.map((item) => (item.id === updatedPost.id ? { ...item, ...updatedPost } : item))
            );
            setSelectedPost((prev) =>
              prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev
            );
          }}
        />
      )}
    </div>
  );
}

export default Search;
