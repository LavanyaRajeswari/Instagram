import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronRight,
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
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAvatarUrl } from "../utils/avatar";


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
const reportOptions = {
  main: {
    title: "Why are you reporting this post?",
    options: [
      { label: "I just don't like it", next: "success" },
      { label: "Bullying or unwanted contact", next: "bullying" },
      { label: "Suicide, self-injury or eating disorders", next: "selfHarm" },
      { label: "Violence, hate or exploitation", next: "violence" },
      { label: "Selling or promoting restricted items", next: "restricted" },
      { label: "Nudity or sexual activity", next: "nudity" },
      { label: "Scam, fraud or spam", next: "scam" },
      { label: "False information", next: "success" },
    ],
  },
  bullying: {
    title: "How is it bullying or unwanted contact?",
    options: [
      { label: "Threatening to share or sharing nude images", next: "success" },
      { label: "Bullying or harassment", next: "success" },
      { label: "Spam", next: "success" },
    ],
  },
  selfHarm: {
    title: "What kind of self-harm?",
    options: [
      { label: "Suicide or self-injury", next: "success" },
      { label: "Eating disorder", next: "success" },
    ],
  },
  violence: {
    title: "How is it violence, hate or exploitation?",
    options: [
      { label: "Credible threat to safety", next: "success" },
      { label: "Seems like terrorism or organized crime", next: "success" },
      { label: "Seems like exploitation", next: "success" },
      { label: "Hate speech or symbols", next: "success" },
      { label: "Calling for violence", next: "success" },
      { label: "Showing violence, death or severe injury", next: "success" },
      { label: "Animal abuse", next: "success" },
    ],
  },
  restricted: {
    title: "What is being sold or promoted?",
    options: [
      { label: "Drugs", next: "success" },
      { label: "Weapons", next: "success" },
      { label: "Animals", next: "success" },
      { label: "Gambling", next: "success" },
      { label: "Alcohol", next: "success" },
      { label: "Tobacco", next: "success" },
    ],
  },
  nudity: {
    title: "How is this nudity or sexual activity?",
    options: [
      { label: "Threatening to share or sharing nude images", next: "success" },
      { label: "Seems like prostitution", next: "success" },
      { label: "Seems like sexual exploitation", next: "success" },
      { label: "Nudity or sexual activity", next: "success" },
    ],
  },
  scam: {
    title: "Which best describes the problem?",
    options: [
      { label: "Fraud or scam", next: "success" },
      { label: "Spam", next: "success" },
    ],
  },
};
const restrictedReportReasons = [
  "Drugs",
  "Weapons",
  "Animals",
  "Gambling",
  "Alcohol",
  "Tobacco",
];

function Reels() {
  const navigate = useNavigate();
  const { currentUser, currentUserId: CURRENT_USER_ID } = useCurrentUser();

  const [embedOpen, setEmbedOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentOptions, setCommentOptions] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [sharePost, setSharePost] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState("main");
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [copyToast, setCopyToast] = useState(false);
  const videoRefs = useRef([]);
  const commentInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        emojiOpen &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [emojiOpen]);

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
        } catch (postsError) {
          console.error("Failed to load posts for reels:", postsError);
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

    await Promise.all(
      reelsNeedingData.map(async (reel) => {
        try {
          const [count, status, savedStatus] = await Promise.all([
            getLikeCount(reel.id),
            CURRENT_USER_ID ? isPostLiked(reel.id, CURRENT_USER_ID) : false,
            CURRENT_USER_ID ? isPostSaved(reel.id, CURRENT_USER_ID) : false,
          ]);

          nextLikes[reel.id] = count || 0;
          nextLiked[reel.id] = Boolean(status);
          nextSaved[reel.id] = Boolean(savedStatus);
          nextMuted[reel.id] = true;
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

  const removeCommentFromTree = (items = [], commentId) =>
    items
      .filter((item) => item.id !== commentId)
      .map((item) => ({
        ...item,
        replies: removeCommentFromTree(getReplies(item), commentId),
      }));

  const countCommentTree = (items = []) =>
    items.reduce((total, item) => total + 1 + countCommentTree(getReplies(item)), 0);

  const isOwnedByCurrentUser = (item) => {
    const itemUserId = item?.user?.id ?? item?.userId;
    return CURRENT_USER_ID != null && String(itemUserId) === String(CURRENT_USER_ID);
  };

  const getPostUrl = (reel = activeReel) =>
    `${window.location.origin}/post/${reel?.id || ""}`;

  const handleLike = async (reel) => {
    if (!CURRENT_USER_ID) {
      alert("Please login first");
      return;
    }

    try {
      const alreadyLiked = Boolean(likedMap[reel.id]);
      const nextLiked = !alreadyLiked;
      const nextCount = Math.max((likesMap[reel.id] || 0) + (nextLiked ? 1 : -1), 0);

      if (alreadyLiked) await unlikePost(reel.id, CURRENT_USER_ID);
      else await likePost(reel.id, CURRENT_USER_ID);

      setLikedMap((prev) => ({ ...prev, [reel.id]: nextLiked }));
      setLikesMap((prev) => ({ ...prev, [reel.id]: nextCount }));
    } catch {
      alert("Like action failed");
    }
  };

  const handleSaveToggle = async (reel) => {
    if (!CURRENT_USER_ID) {
      alert("Please login first");
      return;
    }

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
    if (!CURRENT_USER_ID) {
      alert("Please login first");
      return;
    }

    try {
      if (replyingTo) {
        await addReply(activeReel.id, replyingTo.id, CURRENT_USER_ID, text);
        setExpandedReplies((prev) => ({ ...prev, [replyingTo.id]: true }));
      } else {
        await addComment(activeReel.id, CURRENT_USER_ID, text);
      }

      setCommentText("");
      setEmojiOpen(false);
      setReplyingTo(null);
      await loadComments(activeReel.id);
    } catch {
      alert("Comment failed");
    }
  };

  const handleEmojiSelect = (emojiData) => {
    const emoji = emojiData?.emoji || "";
    if (!emoji) return;

    const input = commentInputRef.current;
    const start = input?.selectionStart ?? commentText.length;
    const end = input?.selectionEnd ?? commentText.length;

    setCommentText(
      (prev) => `${prev.slice(0, start)}${emoji}${prev.slice(end)}`
    );

    requestAnimationFrame(() => {
      const cursorPosition = start + emoji.length;
      commentInputRef.current?.focus();
      commentInputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleCommentLike = async (comment) => {
    if (!CURRENT_USER_ID) {
      alert("Please login first");
      return;
    }

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

  const handleDeleteComment = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!commentOptions || !activeReel) return;
    if (!CURRENT_USER_ID) {
      alert("Please login first");
      return;
    }

    try {
      await deleteComment(activeReel.id, commentOptions.id, CURRENT_USER_ID);
      setCommentsMap((prev) => ({
        ...prev,
        [activeReel.id]: removeCommentFromTree(prev[activeReel.id] || [], commentOptions.id),
      }));
      setCommentOptions(null);
    } catch {
      alert("Delete comment failed");
    }
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

  const closeReportModal = () => {
    setReportOpen(false);
    setReportStep("main");
    setSelectedReportReason("");
  };

  const openReportModal = () => {
    setReportStep("main");
    setSelectedReportReason("");
    setReportOpen(true);
    setMoreMenuOpen(false);
  };

  const handleReportOption = (option) => {
    setSelectedReportReason(option.label);
    setReportStep(option.next);
  };

  const getReportUsername = () =>
    activeReel?.user?.username || "this account";

  const getEmbedCode = (reel = activeReel) =>
    `<iframe src="${getPostUrl(reel)}" width="400" height="600" frameborder="0" allowfullscreen></iframe>`;

  const handleOpenEmbed = () => {
    if (!activeReel) return;
    setEmbedOpen(true);
    setMoreMenuOpen(false);
  };

  const handleCopyEmbed = async () => {
    if (!activeReel) return;
    await copyText(getEmbedCode(activeReel), "Embed code copied!");
  };


  const goNext = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
      setCommentsOpen(false);
      setMoreMenuOpen(false);
      closeReportModal();
    }
  };

  const goPrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
      setCommentsOpen(false);
      setMoreMenuOpen(false);
      closeReportModal();
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
    const profilePicture = getAvatarUrl(reply.user);
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
            <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
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
    const profilePicture = getAvatarUrl(comment.user);
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
            <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
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
              const username = reel.user?.username || "";
              const profilePicture = getAvatarUrl(reel.user);

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
                      {username && <span className="text-sm font-bold">{username}</span>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere] [word-break:break-word]">
                      {reel.caption || ""}
                    </p>
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
                    countCommentTree(commentsMap[activeReel.id] || []) ||
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
                  <div className="absolute bottom-10 left-1/2 z-[100] w-[250px] -translate-x-1/2 overflow-hidden rounded-2xl bg-white text-sm shadow-2xl">
                    <button
                      type="button"
                      onClick={openReportModal}
                      className="block w-full px-5 py-4 text-left font-semibold text-[#ed4956] hover:bg-gray-50"
                    >
                      Report
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCopyToast("Unfollowed");
                        setTimeout(() => setCopyToast(false), 2000);
                        setMoreMenuOpen(false);
                      }}
                      className="block w-full border-t border-gray-100 px-5 py-4 text-left font-semibold text-[#ed4956] hover:bg-gray-50"
                    >
                      Unfollow
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/");
                        setMoreMenuOpen(false);
                      }}
                      className="block w-full border-t border-gray-100 px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Go to post
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSharePost(activeReel);
                        setMoreMenuOpen(false);
                      }}
                      className="block w-full border-t border-gray-100 px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Share to...
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="block w-full border-t border-gray-100 px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenEmbed}
                      className="block w-full border-t border-gray-100 px-5 py-4 text-left hover:bg-gray-50"
                    >
                      Embed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAboutOpen(true);
                        setMoreMenuOpen(false);
                      }}
                      className="block w-full border-t border-gray-100 px-5 py-4 text-left hover:bg-gray-50"
                    >
                      About this account
                    </button>
                  </div>
                )}
              </div>

              <img
                src={getAvatarUrl(activeReel.user)}
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
                  setEmojiOpen(false);
                }}
                className="ml-3 text-[#0095f6]"
              >
                Cancel
              </button>
            </div>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-3">
              <img
                src={getAvatarUrl(currentUser)}
                alt={currentUser.username || "me"}
                className="h-8 w-8 rounded-full object-cover"
              />

              <div className="relative flex flex-1 items-center rounded-full border border-gray-200 px-3 py-2">
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setEmojiOpen((prev) => !prev);
                  }}
                  className="text-gray-500 hover:text-[#262626]"
                  aria-label="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>

                {emojiOpen && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-10 right-0 z-[500] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      width={310}
                      height={360}
                      theme="light"
                      skinTonesDisabled={true}
                      searchDisabled={false}
                      previewConfig={{
                        showPreview: false,
                      }}
                    />
                  </div>
                )}
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
          )}
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

      {copyToast && (
        <div className="fixed left-1/2 top-20 z-[500] -translate-x-1/2 rounded-md bg-[#262626] px-5 py-2 text-xs font-semibold text-white">
          {copyToast}
        </div>
      )}

{reportOpen && (
  <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-[448px] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="relative flex h-[52px] items-center justify-center border-b border-gray-200">
        {reportStep !== "main" && reportStep !== "success" && (
          <button
            type="button"
            onClick={() => setReportStep("main")}
            className="absolute left-4 text-[#262626]"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}

        {reportStep === "success" ? null : (
          <h2 className="text-sm font-bold text-[#262626]">Report</h2>
        )}

        <button
          type="button"
          onClick={closeReportModal}
          className="absolute right-4 text-[#262626]"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {reportStep === "success" ? (
          <div>
            <div className="px-6 pb-8 pt-7 text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-green-500 text-green-500">
                ✓
              </div>

              <h3 className="text-sm font-bold text-[#262626]">
                Thanks for reporting this post
              </h3>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                You'll get a notification once we review your report. Thanks for
                helping us keep Instagram a safe and supportive community.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCopyToast(`Blocked ${getReportUsername()}`);
                setTimeout(() => setCopyToast(false), 2000);
                closeReportModal();
              }}
              className="flex w-full items-center justify-between border-t border-gray-100 px-5 py-4 text-left text-sm text-[#ed4956] hover:bg-gray-50"
            >
              <span>Block {getReportUsername()}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCopyToast("Community Standards opened");
                setTimeout(() => setCopyToast(false), 2000);
              }}
              className="flex w-full items-center justify-between border-t border-gray-100 px-5 py-4 text-left text-sm text-[#262626] hover:bg-gray-50"
            >
              <span>Learn more about our Community Standards</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>

            <div className="border-t border-gray-100 p-3">
              <button
                type="button"
                onClick={closeReportModal}
                className="w-full rounded-lg bg-[#405de6] py-2.5 text-sm font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-gray-100 px-4 py-4">
              <h3 className="text-sm font-bold text-[#262626]">
                {reportOptions[reportStep]?.title}
              </h3>
            </div>

            <div className="py-1">
              {(reportOptions[reportStep]?.options || []).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleReportOption(option)}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-4 text-left text-xs text-[#262626] hover:bg-gray-50"
                >
                  <span>{option.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {embedOpen && activeReel && (
    <div className="fixed inset-0 z-[750] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="relative flex h-[52px] items-center justify-center border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#262626]">Embed</h2>
          <button
            type="button"
            onClick={() => setEmbedOpen(false)}
            className="absolute right-4 text-[#262626]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-3 text-sm text-gray-500">
            Copy this embed code to add this reel to another page.
          </p>

          <textarea
            readOnly
            value={getEmbedCode(activeReel)}
            className="h-[130px] w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-[#262626] outline-none"
          />

          <button
            type="button"
            onClick={handleCopyEmbed}
            className="mt-4 w-full rounded-lg bg-[#0095f6] py-2.5 text-sm font-semibold text-white"
          >
            Copy embed code
          </button>
        </div>
      </div>
    </div>
  )}

  {aboutOpen && activeReel && (
    <div className="fixed inset-0 z-[750] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[400px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="relative flex h-[52px] items-center justify-center border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#262626]">
            About this account
          </h2>
          <button
            type="button"
            onClick={() => setAboutOpen(false)}
            className="absolute right-4 text-[#262626]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 text-center">
          <img
            src={getAvatarUrl(activeReel.user)}
            alt="profile"
            className="mx-auto h-16 w-16 rounded-full object-cover"
          />

          <h3 className="mt-3 text-sm font-semibold text-[#262626]">
            {activeReel.user?.username || "user"}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {activeReel.user?.fullName || "Instagram user"}
          </p>

          <div className="mt-5 rounded-lg border border-gray-200 text-left">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">Account ID</p>
              <p className="text-sm font-semibold text-[#262626]">
                {activeReel.user?.id || "Unavailable"}
              </p>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs text-gray-500">Post ID</p>
              <p className="text-sm font-semibold text-[#262626]">
                {activeReel.id}
              </p>
            </div>
          </div>
        </div>
      </div>
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
