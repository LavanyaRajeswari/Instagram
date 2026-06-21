import { useEffect, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Smile,
  MoreHorizontal,
  MessageSquare,
  Volume2,
  VolumeX,
  Bookmark,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ShareModal from "./ShareModal";
import { likePost, unlikePost, getLikeCount, isPostLiked } from "../api/likesApi";
import { savePost, unsavePost, isPostSaved } from "../api/savedPostsApi";
import { getShareCount } from "../api/shareApi";
import {
  getComments,
  addComment,
  addReply,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../api/commentsApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAvatarUrl } from "../utils/avatar";

function ImmersivePostModal({
  post,
  postsList = [],
  onClose,
  onPostUpdated,
  onSelectPost,
}) {
  const { currentUserId: CURRENT_USER_ID } = useCurrentUser();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likeCount || 0);
  const [saved, setSaved] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [copyToast, setCopyToast] = useState(false);
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [commentOptions, setCommentOptions] = useState(null);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});

  const commentsContainerRef = useRef(null);
  const emojiRef = useRef(null);

  const mediaList = post?.media || [];
  const media = mediaList[mediaIndex];
  const currentIndex = postsList.findIndex((p) => p.id === post?.id);

  const username = post?.user?.username || "user";
  const userPic = getAvatarUrl(post?.user);
  const fullName = post?.user?.fullName || "";

  useEffect(() => {
    if (!post?.id) return;

    setLiked(false);
    setLikesCount(post.likeCount || 0);
    setSaved(false);
    setShareCount(0);
    setNewCommentText("");
    setEmojiOpen(false);
    setIsMuted(true);
    setMediaIndex(0);
    setCommentOptions(null);
    setDeleteConfirmComment(null);
    setReplyingTo(null);
    setReplyText("");
    setExpandedReplies({});

    loadLikeData();
    loadSavedStatus();
    loadShareCount();
    loadComments();
  }, [post?.id, CURRENT_USER_ID]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadLikeData = async () => {
    if (!post?.id || !CURRENT_USER_ID) return;

    try {
      const [count, status] = await Promise.all([
        getLikeCount(post.id),
        isPostLiked(post.id, CURRENT_USER_ID),
      ]);

      setLikesCount(count);
      setLiked(status);
    } catch (error) {
      console.error("Failed to load like data", error);
    }
  };

  const loadSavedStatus = async () => {
    if (!post?.id || !CURRENT_USER_ID) return;

    try {
      const status = await isPostSaved(post.id, CURRENT_USER_ID);
      setSaved(status);
    } catch (error) {
      console.error("Failed to load saved status", error);
    }
  };

  const loadShareCount = async () => {
    if (!post?.id) return;

    try {
      const count = await getShareCount(post.id);
      setShareCount(count);
    } catch (error) {
      console.error("Failed to load share count", error);
    }
  };

  const loadComments = async () => {
    if (!post?.id) return;

    try {
      const data = await getComments(post.id, CURRENT_USER_ID);
      setCommentsList(data || []);
    } catch (error) {
      console.error("Failed to load comments", error);
    }
  };

  const handleLikeToggle = async () => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    try {
      const nextLiked = !liked;
      const nextLikesCount = Math.max(likesCount + (nextLiked ? 1 : -1), 0);

      if (liked) await unlikePost(post.id, CURRENT_USER_ID);
      else await likePost(post.id, CURRENT_USER_ID);

      setLiked(nextLiked);
      setLikesCount(nextLikesCount);
      onPostUpdated?.({ ...post, likeCount: nextLikesCount });
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  const handleSaveToggle = async () => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    try {
      if (saved) await unsavePost(post.id, CURRENT_USER_ID);
      else await savePost(post.id, CURRENT_USER_ID);

      await loadSavedStatus();
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handlePostComment = async () => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    const text = newCommentText.trim();
    if (!text || !post?.id) return;

    try {
      await addComment(post.id, CURRENT_USER_ID, text);
      setNewCommentText("");
      setEmojiOpen(false);
      await loadComments();
      const nextCount = countCommentTree(commentsList) + 1;
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      console.error("Comment failed", error);
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    const text = replyText.trim();
    if (!text) return;

    try {
      await addReply(post.id, parentCommentId, CURRENT_USER_ID, text);
      setReplyText("");
      setReplyingTo(null);
      setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
      await loadComments();
      const nextCount = countCommentTree(commentsList) + 1;
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      console.error("Reply failed", error);
    }
  };

  const handleCommentLike = async (comment) => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    try {
      if (comment.likedByCurrentUser) {
        await unlikeComment(comment.id, CURRENT_USER_ID);
      } else {
        await likeComment(comment.id, CURRENT_USER_ID);
      }

      await loadComments();
    } catch (error) {
      console.error("Comment like failed", error);
    }
  };

  const handleDeleteComment = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!deleteConfirmComment) return;
    if (!CURRENT_USER_ID) return alert("Please login first");

    try {
      await deleteComment(post.id, deleteConfirmComment.id, CURRENT_USER_ID);
      const removedCount = countCommentTree([deleteConfirmComment]);
      const nextCount = Math.max(countCommentTree(commentsList) - removedCount, 0);
      setCommentsList((prev) => removeCommentFromTree(prev, deleteConfirmComment.id));
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
      setDeleteConfirmComment(null);
      setCommentOptions(null);
    } catch (error) {
      console.error("Delete comment failed", error);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post?.id || ""}`);
    setCopyToast(true);
    setShowOptionsPopup(false);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "now";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const handlePrevPost = (e) => {
    e?.stopPropagation();

    if (currentIndex > 0 && onSelectPost) {
      onSelectPost(postsList[currentIndex - 1]);
    }
  };

  const handleNextPost = (e) => {
    e?.stopPropagation();

    if (currentIndex !== -1 && currentIndex < postsList.length - 1 && onSelectPost) {
      onSelectPost(postsList[currentIndex + 1]);
    }
  };
  
  const nextMedia = (e) => {
    e.stopPropagation();
    setMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevMedia = (e) => {
    e.stopPropagation();
    setMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const renderSmallLikeText = (item) => {
    if (!item.likeCount || item.likeCount <= 0) return null;

    return (
      <span className="text-[11px] text-gray-500 font-semibold">
        {item.likeCount} like{item.likeCount > 1 ? "s" : ""}
      </span>
    );
  };

  const renderHeartButton = (item) => (
    <button
      type="button"
      onClick={() => handleCommentLike(item)}
      className="shrink-0"
    >
      <Heart
        className={`w-4 h-4 ${
          item.likedByCurrentUser
            ? "fill-[#ed4956] stroke-[#ed4956] text-[#ed4956]"
            : "text-gray-400"
        }`}
      />
    </button>
  );

  const isOwnedByCurrentUser = (item) => {
    const itemUserId = item?.user?.id ?? item?.userId;
    return CURRENT_USER_ID != null && String(itemUserId) === String(CURRENT_USER_ID);
  };

  const getReplies = (comment) => {
    if (Array.isArray(comment.replies)) return comment.replies;
    if (Array.isArray(comment.children)) return comment.children;
    if (Array.isArray(comment.childComments)) return comment.childComments;
    return [];
  };

  const countCommentTree = (items = []) =>
    items.reduce((total, item) => total + 1 + countCommentTree(getReplies(item)), 0);

  const removeCommentFromTree = (items = [], commentId) =>
    items
      .filter((item) => item.id !== commentId)
      .map((item) => ({
        ...item,
        replies: removeCommentFromTree(getReplies(item), commentId),
      }));

  const renderComment = (comment, depth = 0) => {
    const commentUser = comment.user || {};
    const replies = getReplies(comment);
    const isExpanded = expandedReplies[comment.id];
    const username = commentUser.username || comment.username || "user";

    const handleStartReply = () => {
      setReplyingTo(comment);
      setReplyText(`@${username} `);
    };

    return (
      <div
        key={comment.id}
        className="flex flex-col gap-2"
      >
        <div className="flex items-start gap-3 justify-between group text-[13px]">
          <div className="flex items-start gap-2.5 flex-grow min-w-0">
            <img
              src={
                getAvatarUrl(commentUser.profilePicture ? commentUser : comment)
              }
              alt="commenter"
              className={`${
                depth > 0 ? "w-7 h-7" : "w-8 h-8"
              } rounded-full object-cover border border-gray-100 shrink-0`}
            />

            <div className="min-w-0 flex-grow">
              <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
                <span className="font-semibold mr-1.5 text-[#262626]">
                  {username}
                </span>
                <span className="text-[#262626]">
                  {comment.text}
                </span>
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold">
                <span className="text-gray-400">
                  {formatTimeAgo(comment.createdAt || comment.updatedAt)}
                </span>

                {renderSmallLikeText(comment)}

                <button
                  type="button"
                  className="text-gray-500 hover:text-[#262626] font-semibold"
                  onClick={handleStartReply}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>

          {renderHeartButton(comment)}

          {isOwnedByCurrentUser(comment) && (
            <button
              type="button"
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100"
              onClick={() => setCommentOptions(comment)}
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500 hover:text-[#262626]" />
            </button>
          )}
        </div>

        {replyingTo?.id === comment.id && (
          <div className={`${depth > 0 ? "ml-9" : "ml-11"} mt-1 flex items-center gap-2`}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
              placeholder="Write a reply..."
              className="flex-grow border border-gray-200 rounded-full px-3 py-1.5 text-xs text-[#262626] placeholder-gray-400 outline-none"
              autoFocus
            />

            <button
              type="button"
              onClick={() => handleReply(comment.id)}
              disabled={!replyText.trim()}
              className="text-[#0095f6] disabled:opacity-30 text-xs font-bold"
            >
              Post
            </button>

            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setReplyText("");
              }}
              className="text-gray-400 text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        {replies.length > 0 && (
          <div className={`${depth < 2 ? "ml-11" : "ml-4"} min-w-0`}>
            {!isExpanded ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedReplies((prev) => ({
                    ...prev,
                    [comment.id]: true,
                  }))
                }
                className="text-[12px] font-semibold text-gray-500 hover:text-[#262626]"
              >
                View all {replies.length} repl{replies.length === 1 ? "y" : "ies"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-3 border-l border-gray-100 pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({
                      ...prev,
                      [comment.id]: false,
                    }))
                  }
                  className="text-[12px] font-semibold text-gray-500 hover:text-[#262626] text-left"
                >
                  Hide replies
                </button>

                {replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!post) return null;

  return (
    <div
      className="fixed inset-0 bg-black/65 z-[60000] flex items-center justify-center font-sans text-[#262626] overflow-hidden p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white cursor-pointer z-[70000]"
      >
        <X className="w-8 h-8 text-white stroke-[2]" />
      </button>

      <div
        className="relative grid h-[88vh] max-h-[760px] min-h-0 w-full max-w-[1040px] grid-cols-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl md:grid-cols-[minmax(0,1.35fr)_390px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-black flex items-center justify-center min-h-[320px] md:min-h-0">
          {media ? (
            <div className="w-full h-full flex items-center justify-center relative">
              {media.mediaType === "VIDEO" ? (
                <video
                  src={media.mediaUrl}
                  controls
                  autoPlay
                  loop
                  muted={isMuted}
                  className="w-full h-full object-contain"
                  playsInline
                />
              ) : (
                <img
                  src={media.mediaUrl}
                  alt="post media"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center text-white/60 text-xs">
              No media available
            </div>
          )}

          {media?.mediaType === "VIDEO" && (
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer z-40"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}

          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevMedia}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/45 text-white rounded-full p-2 hover:bg-black/70 z-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={nextMedia}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/45 text-white rounded-full p-2 hover:bg-black/70 z-50"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
                {mediaList.map((_, index) => (
                  <span
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === mediaIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid h-full min-h-0 grid-rows-[62px_minmax(0,1fr)_auto] overflow-hidden border-l border-gray-200 bg-white">
          <div className="h-[62px] px-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={userPic}
                alt="creator avatar"
                className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#262626] truncate">
                  {username}
                </p>
                {fullName && (
                  <p className="text-[11px] text-gray-400 truncate">
                    {fullName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptionsPopup(true)}
              className="p-1 text-[#262626] hover:text-gray-500"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={commentsContainerRef}
            className="min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4 text-left"
          >
            {post.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <img
                  src={userPic}
                  alt="creator avatar"
                  className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-[14px] leading-[19px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
                    <span className="font-semibold mr-1.5">{username}</span>
                    <span>{post.caption}</span>
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>
              </div>
            )}

            {commentsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-[15px] font-semibold text-[#262626] mb-1">
                  No comments yet
                </p>
                <p className="text-gray-400 text-xs">
                  Start the conversation by posting a note.
                </p>
              </div>
            ) : (
              commentsList.map((comment) => renderComment(comment, 0))
            )}
          </div>

          <div className="border-t border-gray-100 shrink-0 bg-white">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLikeToggle}
                    className={liked ? "text-[#ed4956]" : "text-[#262626]"}
                  >
                    <Heart
                      className={`w-[26px] h-[26px] ${
                        liked ? "fill-[#ed4956] stroke-[#ed4956]" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    className="text-[#262626]"
                  >
                    <MessageCircle className="w-[26px] h-[26px]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="text-[#262626]"
                  >
                    <Send className="w-[26px] h-[26px]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToggle}
                  className="text-[#262626]"
                >
                  <Bookmark
                    className={`w-[26px] h-[26px] ${
                      saved ? "fill-[#262626] stroke-[#262626]" : ""
                    }`}
                  />
                </button>
              </div>

              <p className="mt-2 text-[13px] font-semibold text-[#262626]">
                {likesCount} like{likesCount === 1 ? "" : "s"}
              </p>
              {shareCount > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">
                  {shareCount} share{shareCount === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div className="px-3 py-2 border-t border-gray-100 flex gap-2 items-center bg-white relative">
              <div ref={emojiRef} className="relative">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((prev) => !prev)}
                  className="text-[#262626] hover:text-gray-500 cursor-pointer p-1.5"
                >
                  <Smile className="w-[22px] h-[22px]" />
                </button>

                {emojiOpen && (
                  <div className="absolute bottom-[42px] left-0 z-[60000] shadow-2xl rounded-lg overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={(emojiObj) =>
                        setNewCommentText((prev) => prev + emojiObj.emoji)
                      }
                      width={320}
                      height={380}
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

              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePostComment();
                }}
                placeholder="Add a comment..."
                className="flex-grow px-2 py-1 text-sm placeholder-gray-400 outline-none border-none text-[#262626] bg-transparent"
              />

              <button
                onClick={handlePostComment}
                disabled={!newCommentText.trim()}
                className="text-[#0095f6] hover:text-[#3897f0] disabled:opacity-30 text-sm font-semibold px-2"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-y-0 left-4 hidden md:flex items-center z-50">
        <button
          onClick={handlePrevPost}
          disabled={currentIndex <= 0}
          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center text-[#262626] disabled:opacity-20 disabled:cursor-not-allowed shadow"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="fixed inset-y-0 right-4 hidden md:flex items-center z-50">
        <button
          onClick={handleNextPost}
          disabled={currentIndex === -1 || currentIndex >= postsList.length - 1}
          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-gray-200 flex items-center justify-center text-[#262626] disabled:opacity-20 disabled:cursor-not-allowed shadow"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {showOptionsPopup && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[210000] p-4"
          onClick={() => setShowOptionsPopup(false)}
        >
          <div
            className="w-full max-w-[400px] bg-white rounded-xl overflow-hidden text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full py-4 text-sm font-semibold text-[#262626] hover:bg-gray-50"
              onClick={handleCopyLink}
            >
              Copy link
            </button>

            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm text-gray-500 hover:bg-gray-50"
              onClick={() => setShowOptionsPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {commentOptions && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[220000] p-4"
          onClick={() => setCommentOptions(null)}
        >
          <div
            className="w-[320px] bg-white rounded-xl overflow-hidden text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full py-4 text-[#ed4956] font-bold hover:bg-gray-50"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDeleteConfirmComment(commentOptions);
                setCommentOptions(null);
              }}
            >
              Delete
            </button>

            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-gray-500 hover:bg-gray-50"
              onClick={() => setCommentOptions(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {deleteConfirmComment && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[230000] p-4"
          onClick={() => setDeleteConfirmComment(null)}
        >
          <div
            className="w-[320px] bg-white rounded-xl overflow-hidden text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-semibold text-[#262626] mt-5 mb-1">
              Delete comment?
            </h3>
            <p className="text-gray-500 text-sm px-6 mb-5">
              This action cannot be undone.
            </p>

            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-[#ed4956] font-bold hover:bg-gray-50"
              onClick={handleDeleteComment}
            >
              Delete
            </button>

            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-gray-500 hover:bg-gray-50"
              onClick={() => setDeleteConfirmComment(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#262626] shadow-xl text-white text-xs font-semibold py-2.5 px-6 rounded-md z-[240000]">
          Link copied to clipboard!
        </div>
      )}

      {shareModalOpen && (
        <ShareModal
          post={post}
          currentUserId={CURRENT_USER_ID}
          onClose={() => setShareModalOpen(false)}
          onShared={(count) => setShareCount(count)}
        />
      )}
    </div>
  );
}

export default ImmersivePostModal;
