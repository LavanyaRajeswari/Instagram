import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Volume2,
  VolumeX,
  X,
  Smile,
} from "lucide-react";

import { getPosts } from "../api/postsApi";
import { getReels as getPaginatedReels } from "../api/reelsApi";
import { likePost, unlikePost, getLikeCount, isPostLiked } from "../api/likesApi";
import { savePost, unsavePost, isPostSaved } from "../api/savedPostsApi";
import {
  getComments,
  addComment,
  addReply,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../api/commentsApi";
import ShareModal from "../components/ShareModal";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || { id: 1 };
  } catch {
    return { id: 1 };
  }
};

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const getMediaList = (post) => {
  if (Array.isArray(post.media) && post.media.length > 0) {
    return post.media.map((item) => ({
      mediaUrl: item.mediaUrl || item.url || "",
      mediaType: item.mediaType || "",
    }));
  }

  if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
    return post.imageUrls.map((url) => ({
      mediaUrl: url,
      mediaType: isVideoUrl(url) ? "VIDEO" : "IMAGE",
    }));
  }

  if (Array.isArray(post.images) && post.images.length > 0) {
    return post.images.map((item) => ({
      mediaUrl: item.imageUrl || item.mediaUrl || "",
      mediaType: item.mediaType || "",
    }));
  }

  return [];
};

const isVideoMedia = (media) =>
  media?.mediaType?.toUpperCase() === "VIDEO" || isVideoUrl(media?.mediaUrl);

const MAX_REPLY_DEPTH = 2;
const REELS_PAGE_SIZE = 10;
const LOAD_MORE_THRESHOLD = 3;
const getHeartClassName = (liked) =>
  `h-4 w-4 ${
    liked ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]" : "text-gray-400"
  }`;

function Reels() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const CURRENT_USER_ID = currentUser?.id || 1;

  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreReels, setHasMoreReels] = useState(true);

  const [likedMap, setLikedMap] = useState({});
  const [likesMap, setLikesMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [mutedMap, setMutedMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentOptions, setCommentOptions] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [sharePost, setSharePost] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState("main");
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [followingMap, setFollowingMap] = useState({});
  const [embedOpen, setEmbedOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const videoRefs = useRef([]);
  const moreMenuRef = useRef(null);
  const loadingReelsRef = useRef(false);
  const hasMoreReelsRef = useRef(true);
  const reelPageRef = useRef(0);

  const reels = useMemo(() => {
    const seen = new Set();

    return posts
      .flatMap((post) =>
        getMediaList(post)
          .filter(isVideoMedia)
          .map((media) => ({
            ...post,
            reelVideoUrl: media.mediaUrl,
          }))
      )
      .filter((reel) => {
        const key = `${reel.id}-${reel.reelVideoUrl}`;
        if (!reel.reelVideoUrl || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [posts]);

  const activeReel = reels[activeIndex];

  useEffect(() => {
    loadReels(0, true);
  }, []);

  useEffect(() => {
    if (reels.length > 0) loadReelData(reels);
  }, [reels.length]);

  useEffect(() => {
    if (
      loading ||
      loadingMore ||
      !hasMoreReels ||
      reels.length === 0 ||
      activeIndex < reels.length - LOAD_MORE_THRESHOLD
    ) {
      return;
    }

    loadReels(reelPageRef.current + 1);
  }, [activeIndex, reels.length, loading, loadingMore, hasMoreReels]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, reels.length]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        moreMenuOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target)
      ) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [moreMenuOpen]);

  const getPostsFromPageResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const isLastPageResponse = (data, pagePosts) => {
    if (typeof data?.last === "boolean") return data.last;
    if (typeof data?.totalPages === "number" && typeof data?.number === "number") {
      return data.number >= data.totalPages - 1;
    }

    return pagePosts.length < REELS_PAGE_SIZE;
  };

  const appendUniquePosts = (pagePosts, reset = false) => {
    setPosts((prev) => {
      const existingIds = new Set(reset ? [] : prev.map((post) => String(post.id)));
      const uniquePosts = pagePosts.filter((post) => {
        const key = String(post.id);
        if (existingIds.has(key)) return false;
        existingIds.add(key);
        return true;
      });

      return reset ? uniquePosts : [...prev, ...uniquePosts];
    });
  };

  const setHasMore = (value) => {
    hasMoreReelsRef.current = value;
    setHasMoreReels(value);
  };

  const loadReels = async (page = 0, reset = false) => {
    if (loadingReelsRef.current) return;
    if (!reset && !hasMoreReelsRef.current) return;

    loadingReelsRef.current = true;

    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const data = await getPaginatedReels({ page, size: REELS_PAGE_SIZE });
      const pagePosts = getPostsFromPageResponse(data);

      appendUniquePosts(pagePosts, reset);
      reelPageRef.current = page;
      setHasMore(!isLastPageResponse(data, pagePosts));
    } catch (error) {
      console.error("Failed to load reels:", error);

      if (reset) {
        try {
          const data = await getPosts();
          setPosts(Array.isArray(data) ? data : []);
        } catch (fallbackError) {
          console.error("Failed to load fallback reels:", fallbackError);
          setPosts([]);
        }
      }

      setHasMore(false);
    } finally {
      loadingReelsRef.current = false;
      if (reset) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const loadReelData = async (targetReels = reels) => {
    const reelsNeedingData = targetReels.filter(
      (reel) =>
        !Object.prototype.hasOwnProperty.call(likesMap, reel.id) ||
        !Object.prototype.hasOwnProperty.call(likedMap, reel.id) ||
        !Object.prototype.hasOwnProperty.call(savedMap, reel.id)
    );

    if (reelsNeedingData.length === 0) return;

    const nextLikes = {};
    const nextLiked = {};
    const nextSaved = {};
    const nextMuted = {};
    const nextFollowing = {};

    await Promise.all(
      reelsNeedingData.map(async (reel) => {
        try {
          const [count, status, savedStatus] = await Promise.all([
            getLikeCount(reel.id),
            isPostLiked(reel.id, CURRENT_USER_ID),
            isPostSaved(reel.id, CURRENT_USER_ID),
          ]);

          nextLikes[reel.id] = count || 0;
          nextLiked[reel.id] = Boolean(status);
          nextSaved[reel.id] = Boolean(savedStatus);
          nextMuted[reel.id] = true;

          const userKey = getUserKey(reel);
          if (userKey) nextFollowing[userKey] = Boolean(followingMap[userKey]);
        } catch {
          nextLikes[reel.id] = reel.likeCount || 0;
          nextLiked[reel.id] = false;
          nextSaved[reel.id] = false;
          nextMuted[reel.id] = true;
        }
      })
    );

    setLikesMap((prev) => ({ ...prev, ...nextLikes }));
    setLikedMap((prev) => ({ ...prev, ...nextLiked }));
    setSavedMap((prev) => ({ ...prev, ...nextSaved }));
    setMutedMap((prev) => ({ ...prev, ...nextMuted }));
    setFollowingMap((prev) => ({ ...nextFollowing, ...prev }));
  };

  const loadComments = async (postId) => {
    const data = await getComments(postId, CURRENT_USER_ID);

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: Array.isArray(data) ? data : [],
    }));
  };

  const getReplies = (comment) =>
    comment.replies || comment.children || comment.childComments || [];

  const getUserKey = (reel) => reel?.user?.id || reel?.user?.username || "unknown";

  const isOwnedByCurrentUser = (item) => {
    const itemUserId = item?.user?.id ?? item?.userId;
    return CURRENT_USER_ID != null && String(itemUserId) === String(CURRENT_USER_ID);
  };

  const getPostUrl = (reel = activeReel) =>
    `${window.location.origin}/posts/${reel?.id || ""}`;

  const getEmbedCode = () =>
    `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${getPostUrl()}" data-instgrm-version="14"></blockquote>`;

  const handleLike = async (reel) => {
    try {
      const alreadyLiked = likedMap[reel.id];

      if (alreadyLiked) await unlikePost(reel.id, CURRENT_USER_ID);
      else await likePost(reel.id, CURRENT_USER_ID);

      const count = await getLikeCount(reel.id);

      setLikedMap((prev) => ({ ...prev, [reel.id]: !alreadyLiked }));
      setLikesMap((prev) => ({ ...prev, [reel.id]: count }));
    } catch {
      alert("Like action failed");
    }
  };

  const handleSaveToggle = async (reel) => {
    try {
      const alreadySaved = Boolean(savedMap[reel.id]);

      if (alreadySaved) await unsavePost(reel.id, CURRENT_USER_ID);
      else await savePost(reel.id, CURRENT_USER_ID);

      setSavedMap((prev) => ({ ...prev, [reel.id]: !alreadySaved }));
    } catch {
      alert("Save action failed");
    }
  };

  const openComments = async (reel) => {
    await loadComments(reel.id);
    setCommentsOpen(true);
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || !activeReel) return;

    try {
      if (replyingTo) {
        await addReply(activeReel.id, replyingTo.id, CURRENT_USER_ID, text);
        setExpandedReplies((prev) => ({ ...prev, [replyingTo.id]: true }));
      } else {
        await addComment(activeReel.id, CURRENT_USER_ID, text);
      }

      setCommentText("");
      setReplyingTo(null);
      await loadComments(activeReel.id);
    } catch {
      alert("Comment failed");
    }
  };

  const handleCommentLike = async (comment) => {
    try {
      if (comment.likedByCurrentUser) {
        await unlikeComment(comment.id, CURRENT_USER_ID);
      } else {
        await likeComment(comment.id, CURRENT_USER_ID);
      }

      await loadComments(activeReel.id);
    } catch {
      alert("Comment like failed");
    }
  };

  const handleDeleteComment = async () => {
    if (!commentOptions || !activeReel) return;

    try {
      await deleteComment(commentOptions.id, activeReel.id);
      setCommentOptions(null);
      await loadComments(activeReel.id);
    } catch {
      alert("Delete comment failed");
    }
  };

  const handleFollowToggle = (reel) => {
    const key = getUserKey(reel);
    setFollowingMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUnfollow = () => {
    if (!activeReel) return;

    setFollowingMap((prev) => ({
      ...prev,
      [getUserKey(activeReel)]: false,
    }));

    setMoreMenuOpen(false);
  };

  const copyText = async (text, successMessage = "Link copied!") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(successMessage);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      alert("Copy failed");
    }
  };

  const handleCopyLink = async () => {
    if (!activeReel) return;
    await copyText(getPostUrl(activeReel), "Link copied!");
    setMoreMenuOpen(false);
  };

  const openReport = () => {
    setReportOpen(true);
    setReportStep("main");
    setSelectedReportReason("");
    setMoreMenuOpen(false);
  };

  const closeReport = () => {
    setReportOpen(false);
    setReportStep("main");
    setSelectedReportReason("");
  };

  const submitReport = () => {
    alert("Report submitted");
    closeReport();
  };

  const openEmbed = () => {
    setEmbedOpen(true);
    setMoreMenuOpen(false);
  };

  const openAbout = () => {
    setAboutOpen(true);
    setMoreMenuOpen(false);
  };

  const goNext = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
      setCommentsOpen(false);
      setMoreMenuOpen(false);
    }
  };

  const goPrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      setCommentsOpen(false);
      setMoreMenuOpen(false);
    }
  };

  const toggleMute = (postId) => {
    setMutedMap((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatCount = (value = 0) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value;
  };

  const formatDateJoined = (dateString) => {
    if (!dateString) return "April 2023";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "April 2023";
    }
  };

  const renderSmallLikeText = (item) => {
    if (!item.likeCount || item.likeCount <= 0) return null;

    return (
      <span>
        {item.likeCount} like{item.likeCount > 1 ? "s" : ""}
      </span>
    );
  };

  const renderReply = (reply, depth = 1) => {
    const replies = getReplies(reply);
    const username = reply.user?.username || reply.username || "user";
    const profilePicture =
      reply.user?.profilePicture || "https://ui-avatars.com/api/?name=User";
    const isExpanded = expandedReplies[reply.id];
    const visualDepth = Math.min(depth, MAX_REPLY_DEPTH);

    return (
      <div
        key={reply.id}
        className="mt-3 min-w-0"
        style={{ marginLeft: visualDepth > 1 ? "18px" : "0px" }}
      >
        <div className="relative flex w-full min-w-0 items-start gap-2 pr-8">
          <img
            src={profilePicture}
            alt="profile"
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="break-words text-[13px] leading-[18px] text-[#262626] [word-break:normal]">
              <span className="mr-1 whitespace-nowrap font-semibold">
                {username}
              </span>
              {reply.text}
            </p>

            <div className="mt-1 flex flex-nowrap items-center gap-x-3 whitespace-nowrap text-[11px] leading-4 text-gray-500">
              {renderSmallLikeText(reply)}

              <button
                type="button"
                onClick={() => {
                  setReplyingTo(reply);
                  setCommentText(`@${username} `);
                }}
              >
                Reply
              </button>

              {isOwnedByCurrentUser(reply) && (
                <button type="button" onClick={() => setCommentOptions(reply)}>
                  Delete
                </button>
              )}
            </div>

            {replies.length > 0 && visualDepth < MAX_REPLY_DEPTH && (
              <div className="mt-2">
                {!isExpanded ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReplies((prev) => ({
                        ...prev,
                        [reply.id]: true,
                      }))
                    }
                    className="text-[12px] font-semibold text-gray-500"
                  >
                    View all {replies.length} repl
                    {replies.length === 1 ? "y" : "ies"}
                  </button>
                ) : (
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedReplies((prev) => ({
                          ...prev,
                          [reply.id]: false,
                        }))
                      }
                      className="mb-2 text-[12px] font-semibold text-gray-500"
                    >
                      Hide replies
                    </button>
                    {replies.map((childReply) => renderReply(childReply, depth + 1))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleCommentLike(reply)}
            className="absolute right-0 top-0 flex h-6 w-6 items-start justify-center pt-1"
          >
            <Heart className={getHeartClassName(reply.likedByCurrentUser)} />
          </button>
        </div>
      </div>
    );
  };

  const renderComment = (comment) => {
    const replies = getReplies(comment);
    const username = comment.user?.username || comment.username || "user";
    const profilePicture =
      comment.user?.profilePicture || "https://ui-avatars.com/api/?name=User";
    const isExpanded = expandedReplies[comment.id];

    return (
      <div
        key={comment.id}
        className="relative flex min-w-0 items-start gap-3 pr-8"
      >
        <img
          src={profilePicture}
          alt="profile"
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="break-words text-[13px] leading-[18px] text-[#262626] [word-break:normal]">
            <span className="mr-1 whitespace-nowrap font-semibold">
              {username}
            </span>
            {comment.text}
          </p>

          <div className="mt-1 flex flex-nowrap items-center gap-x-3 whitespace-nowrap text-[11px] leading-4 text-gray-500">
            {renderSmallLikeText(comment)}

            <button
              type="button"
              onClick={() => {
                setReplyingTo(comment);
                setCommentText(`@${username} `);
              }}
            >
              Reply
            </button>

            {isOwnedByCurrentUser(comment) && (
              <button type="button" onClick={() => setCommentOptions(comment)}>
                Delete
              </button>
            )}
          </div>

          {replies.length > 0 && (
            <div className="mt-3">
              {!isExpanded ? (
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-gray-300" />
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReplies((prev) => ({
                        ...prev,
                        [comment.id]: true,
                      }))
                    }
                    className="text-[12px] font-semibold text-gray-500"
                  >
                    View all {replies.length} repl
                    {replies.length === 1 ? "y" : "ies"}
                  </button>
                </div>
              ) : (
                <div className="relative min-w-0 pl-5">
                  <span className="absolute bottom-0 left-0 top-0 w-px bg-gray-300" />
                  <div className="mb-2 flex items-center gap-3">
                    <span className="h-px w-8 bg-gray-300" />
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedReplies((prev) => ({
                          ...prev,
                          [comment.id]: false,
                        }))
                      }
                      className="text-[12px] font-semibold text-gray-500"
                    >
                      Hide replies
                    </button>
                  </div>

                  {replies.map((reply) => renderReply(reply, 1))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleCommentLike(comment)}
          className="absolute right-0 top-0 flex h-6 w-6 items-start justify-center pt-1"
        >
          <Heart className={getHeartClassName(comment.likedByCurrentUser)} />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Loading reels...</p>
      </main>
    );
  }

  if (reels.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <p className="text-sm text-gray-500">No reels available yet.</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="fixed left-5 top-5 z-50 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="mx-auto flex min-h-screen max-w-[760px] items-center justify-center px-4 py-5">
        <div className="relative flex items-end gap-5">
          <div className="relative h-[92vh] max-h-[860px] w-[420px] overflow-hidden rounded-lg bg-black max-sm:w-[calc(100vw-32px)]">
            {reels.map((reel, index) => {
              const active = index === activeIndex;
              const username = reel.user?.username || "instagram_user";
              const profilePicture =
                reel.user?.profilePicture || "https://ui-avatars.com/api/?name=User";
              const userKey = getUserKey(reel);
              const isFollowing = Boolean(followingMap[userKey]);

              return (
                <div
                  key={`${reel.id}-${reel.reelVideoUrl}`}
                  className={`absolute inset-0 ${
                    active ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    src={reel.reelVideoUrl}
                    className="h-full w-full object-contain"
                    autoPlay={active}
                    loop
                    muted={mutedMap[reel.id] ?? true}
                    playsInline
                  />

                  <button
                    type="button"
                    onClick={() => toggleMute(reel.id)}
                    className="absolute bottom-5 right-5 z-30 rounded-full bg-black/50 p-2 text-white"
                  >
                    {mutedMap[reel.id] ?? true ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-24 text-white">
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={profilePicture}
                        alt="profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-bold">{username}</span>
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(reel)}
                        className="rounded-md border border-white px-2 py-0.5 text-xs font-semibold"
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                    <p className="text-sm">{reel.caption || ""}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {activeReel && (
            <div className="mb-8 flex flex-col items-center gap-5 text-[#262626]">
              <button
                type="button"
                onClick={() => handleLike(activeReel)}
                className="flex flex-col items-center gap-1"
              >
                <Heart
                  className={`h-8 w-8 ${
                    likedMap[activeReel.id]
                      ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]"
                      : ""
                  }`}
                />
                <span className="text-[11px] font-semibold">
                  {formatCount(likesMap[activeReel.id] || 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => openComments(activeReel)}
                className="flex flex-col items-center gap-1"
              >
                <MessageCircle className="h-8 w-8" />
                <span className="text-[11px] font-semibold">
                  {formatCount(
                    commentsMap[activeReel.id]?.length ||
                      activeReel.commentCount ||
                      activeReel.commentsCount ||
                      0
                  )}
                </span>
              </button>

              <button type="button" onClick={() => setSharePost(activeReel)}>
                <Send className="h-8 w-8" />
              </button>

              <button type="button" onClick={() => handleSaveToggle(activeReel)}>
                <Bookmark
                  className={`h-8 w-8 ${
                    savedMap[activeReel.id] ? "fill-[#262626] stroke-[#262626]" : ""
                  }`}
                />
              </button>

              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((prev) => !prev)}
                >
                  <MoreHorizontal className="h-8 w-8" />
                </button>

                {moreMenuOpen && (
                  <div className="absolute bottom-10 left-1/2 z-[100] w-[230px] -translate-x-1/2 overflow-hidden rounded-2xl bg-white text-sm shadow-2xl">
                    <button
                      type="button"
                      onClick={openReport}
                      className="block w-full px-5 py-4 text-left text-[#ed4956] hover:bg-gray-50"
                    >
                      Report
                    </button>
                    <button
                      type="button"
                      onClick={handleUnfollow}
                      className="block w-full px-5 py-4 text-left text-[#ed4956] hover:bg-gray-50"
                    >
                      Unfollow
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen(false)}
                      className="block w-full px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Go to post
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSharePost(activeReel);
                        setMoreMenuOpen(false);
                      }}
                      className="block w-full px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Share to...
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="block w-full px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={openEmbed}
                      className="block w-full px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Embed
                    </button>
                    <button
                      type="button"
                      onClick={openAbout}
                      className="block w-full px-5 py-4 text-left hover:bg-gray-50"
                    >
                      About this account
                    </button>
                  </div>
                )}
              </div>

              <img
                src={
                  activeReel.user?.profilePicture ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt="profile"
                className="h-8 w-8 rounded-md border object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {commentsOpen && activeReel && (
        <div className="fixed left-[calc(50%+255px)] top-[54%] z-[200] flex h-[560px] w-[390px] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl max-xl:left-auto max-xl:right-8 max-lg:right-5 max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:h-[70vh] max-sm:w-full max-sm:translate-y-0 max-sm:rounded-t-2xl">
          <div className="relative flex items-center justify-center border-b border-gray-100 px-4 py-4">
            <button
              type="button"
              onClick={() => setCommentsOpen(false)}
              className="absolute left-4"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-semibold">Comments</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {(commentsMap[activeReel.id] || []).length === 0 ? (
              <p className="mt-10 text-center text-sm text-gray-400">
                No comments yet.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {(commentsMap[activeReel.id] || []).map(renderComment)}
              </div>
            )}
          </div>

          {replyingTo && (
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
              Replying to{" "}
              <span className="font-semibold">
                {replyingTo.user?.username || replyingTo.username || "user"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setCommentText("");
                }}
                className="ml-3 text-[#0095f6]"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-3">
            <img
              src={currentUser?.profilePicture || "https://ui-avatars.com/api/?name=User"}
              alt="me"
              className="h-8 w-8 rounded-full object-cover"
            />

            <div className="flex flex-1 items-center rounded-full border border-gray-200 px-3 py-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <Smile className="h-5 w-5 text-gray-500" />
            </div>

            <button
              type="button"
              disabled={!commentText.trim()}
              onClick={handleAddComment}
              className="text-sm font-semibold text-[#0095f6] disabled:opacity-40"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {loadingMore && (
        <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-500 shadow">
          Loading more reels...
        </div>
      )}

      <div className="fixed right-8 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-5">
        <button
          type="button"
          onClick={goPrevious}
          disabled={activeIndex === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow disabled:opacity-30"
        >
          <ChevronUp />
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex === reels.length - 1}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow disabled:opacity-30"
        >
          <ChevronDown />
        </button>
      </div>

      {commentOptions && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60">
          <div className="w-[320px] overflow-hidden rounded-xl bg-white text-center">
            <button
              type="button"
              onClick={handleDeleteComment}
              className="block w-full py-4 font-bold text-[#ed4956]"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setCommentOptions(null)}
              className="block w-full border-t py-4 text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative flex items-center justify-center border-b px-4 py-4">
              {reportStep !== "main" && (
                <button
                  type="button"
                  onClick={() => setReportStep("main")}
                  className="absolute left-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}

              <h3 className="text-sm font-semibold">Report</h3>

              <button type="button" onClick={closeReport} className="absolute right-4">
                <X className="h-6 w-6" />
              </button>
            </div>

            {reportStep === "main" ? (
              <>
                <h4 className="px-4 py-4 text-sm font-semibold">
                  Why are you reporting this post?
                </h4>

                {[
                  "I just don't like it",
                  "Bullying or unwanted contact",
                  "Suicide, self-injury or eating disorders",
                  "Violence, hate or exploitation",
                  "Selling or promoting restricted items",
                  "Nudity or sexual activity",
                  "Scam, fraud or spam",
                  "False information",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setSelectedReportReason(reason);
                      setReportStep("detail");
                    }}
                    className="flex w-full items-center justify-between border-t px-4 py-4 text-left text-sm hover:bg-gray-50"
                  >
                    {reason}
                    <span>›</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <h4 className="px-4 py-4 text-sm font-semibold">
                  Which best describes the problem?
                </h4>

                {["Fraud or scam", "Spam"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReportReason(reason)}
                    className="flex w-full items-center justify-between border-t px-4 py-4 text-left text-sm hover:bg-gray-50"
                  >
                    {reason}
                    <span>{selectedReportReason === reason ? "✓" : "›"}</span>
                  </button>
                ))}

                <div className="p-4">
                  <button
                    type="button"
                    onClick={submitReport}
                    className="w-full rounded-lg bg-[#818cf8] py-2 text-sm font-semibold text-white"
                  >
                    Submit report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {embedOpen && activeReel && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-[450px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative flex items-center justify-center border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Embed</h3>
              <button
                type="button"
                onClick={() => setEmbedOpen(false)}
                className="absolute right-4"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <textarea
                readOnly
                value={getEmbedCode()}
                className="h-12 w-full resize-none rounded-md border border-gray-300 p-2 text-xs outline-none"
              />

              <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked readOnly />
                Include caption
              </label>

              <button
                type="button"
                onClick={() => copyText(getEmbedCode(), "Embed code copied!")}
                className="mt-3 w-full rounded-lg bg-[#4f46e5] py-2 text-sm font-semibold text-white"
              >
                Copy embed code
              </button>

              <p className="mt-3 text-[11px] text-gray-500">
                By using this embed, you agree to Instagram's API Terms of Use.
              </p>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && activeReel && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-[450px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative flex items-center justify-center border-b px-4 py-4">
              <h3 className="text-sm font-semibold">About this account</h3>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                className="absolute right-4"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 text-center">
              <img
                src={
                  activeReel.user?.profilePicture ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt="profile"
                className="mx-auto h-16 w-16 rounded-full object-cover"
              />

              <h4 className="mt-3 text-sm font-bold">
                {activeReel.user?.username || "instagram_user"}
              </h4>

              <p className="mx-auto mt-3 max-w-[330px] text-xs leading-5 text-gray-500">
                To help keep our community authentic, we're showing information
                about profiles on Instagram.
              </p>

              <div className="mt-6 space-y-5 text-left">
                <div className="flex items-center gap-4">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-sm text-[#262626]">Date joined</p>
                    <p className="text-sm text-gray-500">
                      {formatDateJoined(activeReel.user?.createdAt || activeReel.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-sm text-[#262626]">Account based in</p>
                    <p className="text-sm text-gray-500">India</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xl">👤</span>
                    <p className="text-sm text-[#262626]">Former usernames</p>
                  </div>
                  <span className="text-sm text-gray-500">1 ›</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                className="mt-4 text-sm text-[#262626]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {copyToast && (
        <div className="fixed left-1/2 top-20 z-[500] -translate-x-1/2 rounded-md bg-[#262626] px-5 py-2 text-xs font-semibold text-white">
          {copyToast}
        </div>
      )}

      {sharePost && (
        <ShareModal
          post={sharePost}
          currentUserId={CURRENT_USER_ID}
          onClose={() => setSharePost(null)}
        />
      )}
    </main>
  );
}

export default Reels;
