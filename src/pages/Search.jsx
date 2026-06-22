import { useEffect, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImmersivePostModal from "../components/ImmersivePostModal";
import { searchUsers } from "../api/userApi";
import { getExplorePosts, searchPosts } from "../api/postsApi";
import { getTrendingHashtags } from "../api/hashtagsApi";
import { getAvatarUrl } from "../utils/avatar";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

function Search({ onCreateClick }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [explorePosts, setExplorePosts] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    loadExplorePosts();
    loadTrendingHashtags();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setUserResults([]);
      setPostResults([]);
      return;
    }

    const timer = setTimeout(() => {
      runSearch(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadExplorePosts = async () => {
    try {
      const data = await getExplorePosts();
      setExplorePosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load explore posts", error);
      setExplorePosts([]);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const data = await getTrendingHashtags(10);
      setTrendingHashtags(data);
    } catch (error) {
      console.error("Failed to load trending hashtags", error);
      setTrendingHashtags([]);
    }
  };

  const runSearch = async (value) => {
    try {
      setLoading(true);

      const [users, posts] = await Promise.all([
        searchUsers(value),
        searchPosts(value),
      ]);

      setUserResults(Array.isArray(users) ? users : []);
      setPostResults(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error("Search failed", error);
      setUserResults([]);
      setPostResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPostMedia = (post) => {
    if (Array.isArray(post.media) && post.media.length > 0) {
      return post.media[0]?.mediaUrl;
    }

    if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
      return post.imageUrls[0];
    }

    return null;
  };

  const visiblePosts = query.trim() ? postResults : explorePosts;

  return (
    <div className="min-h-screen bg-white">
        <main className="min-h-screen">
        <section className="mx-auto max-w-[935px] px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-5 text-2xl font-bold text-[#262626]">Search</h1>

            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

              <input
                value={query}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-11 w-full rounded-lg bg-[#efefef] pl-12 pr-11 text-sm text-[#262626] outline-none placeholder:text-gray-500"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-400 p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {searchFocused && query.trim() && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-[#262626]">
                  Search results
                </h2>
              </div>

              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  Searching...
                </p>
              ) : userResults.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  No users found
                </p>
              ) : (
                <div>
                  {userResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => navigate(`/profile?userId=${user.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <img
                        src={getAvatarUrl(user)}
                        alt={user.username}
                        className="h-11 w-11 rounded-full object-cover"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#262626]">
                          {user.username}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {user.fullName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!query.trim() && trendingHashtags.length > 0 && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-[#262626]">Trending hashtags</h2>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {trendingHashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate(`/hashtags/${String(tag).replace(/^#/, "")}`)}
                    className="rounded-full border border-[#dbdbdb] px-3 py-1.5 text-sm font-semibold hover:bg-[#fafafa]"
                  >
                    #{String(tag).replace(/^#/, "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-base font-bold text-[#262626]">
              {query.trim() ? "Posts" : "Explore"}
            </h2>

            {visiblePosts.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-500">
                No posts found
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {visiblePosts.map((post) => {
                  const mediaUrl = getPostMedia(post);

                  if (!mediaUrl) return null;

                  return (
                    <button
                        key={post.id}
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="relative aspect-square overflow-hidden bg-gray-100"
                      >
                        {isVideoUrl(mediaUrl) ? (
                          <>
                            <video
                              src={mediaUrl}
                              muted
                              playsInline
                              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                            />
                            <span className="absolute right-2 top-2 text-xs font-bold text-white">
                              ▶
                            </span>
                          </>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={post.caption || "post"}
                            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"/>
                        )}
                      </button>);
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedPost && (
        <ImmersivePostModal
          post={selectedPost}
          postsList={visiblePosts}
          onClose={() => setSelectedPost(null)}
          onPostUpdated={(updatedPost) => {
            setExplorePosts((prev) =>
              prev.map((item) =>
                item.id === updatedPost.id ? { ...item, ...updatedPost } : item
              )
            );

            setPostResults((prev) =>
              prev.map((item) =>
                item.id === updatedPost.id ? { ...item, ...updatedPost } : item
              )
            );

            setSelectedPost((prev) =>
              prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev
            );
          }}
          onSelectPost={(post) => setSelectedPost(post)}
        />
      )}
    </div>
  );
}

export default Search;
