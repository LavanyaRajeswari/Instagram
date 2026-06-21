import { useEffect, useRef, useState } from "react";
import { deletePost, updatePost } from "../api/postsApi";
import { likePost, unlikePost, getLikeCount, isPostLiked } from "../api/likesApi";
import { savePost, unsavePost, isPostSaved } from "../api/savedPostsApi";
import { getShareCount } from "../api/shareApi";
import ShareModal from "./ShareModal";
import {
  getComments,
  addComment,
  addReply,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../api/commentsApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import EmojiPicker from "emoji-picker-react";
import {
  Heart,
  MessageCircle,
  Send,
  X,
  Smile,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";

function PostCard({ post, onPostUpdated, onPostDeleted, onMediaClick }) {
  const { currentUserId: CURRENT_USER_ID } = useCurrentUser();

  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption || "");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likeCount || 0);
  const [saved, setSaved] = useState(false);
  const [, setShareCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [modalEditing, setModalEditing] = useState(false);
  const [modalCaption, setModalCaption] = useState(post.caption || "");
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const [comments, setComments] = useState([]);
  const [localCommentCount, setLocalCommentCount] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});

  const [mediaIndex, setMediaIndex] = useState(0);
  const [commentOptions, setCommentOptions] = useState(null);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState(null);
  const [postOptionsOpen, setPostOptionsOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const emojiRef = useRef(null);

  const username = post.user?.username || "user";
  const fullName = post.user?.fullName || "";
  const profilePicture = getAvatarUrl(post.user);

  const mediaList =
    post.media && post.media.length > 0
      ? post.media
      : post.imageUrls && post.imageUrls.length > 0
        ? post.imageUrls.map((url) => ({ mediaUrl: url, mediaType: "IMAGE" }))
        : [];

  const currentMedia = mediaList[mediaIndex];
  const commentCount =
    localCommentCount ?? post.commentCount ?? post.commentsCount ?? post.totalComments ?? 0;

  const isOwnedByCurrentUser = (item) => {
    const itemUserId = item?.user?.id ?? item?.userId;
    return CURRENT_USER_ID != null && String(itemUserId) === String(CURRENT_USER_ID);
  };

  useEffect(() => {
    setCaption(post.caption || "");
    setModalCaption(post.caption || "");
    setModalEditing(false);
    setCaptionExpanded(false);
    setLikes(post.likeCount || 0);
    setMediaIndex(0);
    setIsMuted(true);
    loadLikeData();
    loadSavedStatus();
    loadShareCount();
  }, [post.id, CURRENT_USER_ID]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return error.message || fallback;
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
    return `${Math.floor(days / 7)}w`;
  };

  const loadLikeData = async () => {
    if (!post.id || !CURRENT_USER_ID) return;

    try {
      const [count, status] = await Promise.all([
        getLikeCount(post.id),
        isPostLiked(post.id, CURRENT_USER_ID),
      ]);
      setLikes(count);
      setLiked(status);
    } catch (error) {
      console.error("Failed to load like data", error);
    }
  };

  const loadSavedStatus = async () => {
    if (!post.id || !CURRENT_USER_ID) return;

    try {
      const status = await isPostSaved(post.id, CURRENT_USER_ID);
      setSaved(status);
    } catch (error) {
      console.error("Failed to load saved status", error);
    }
  };

  const loadShareCount = async () => {
    if (!post.id) return;

    try {
      const count = await getShareCount(post.id);
      setShareCount(count);
    } catch (error) {
      console.error("Failed to load share count", error);
    }
  };

  const loadComments = async () => {
    if (!post.id) return;

    try {
      const data = await getComments(post.id, CURRENT_USER_ID);
      const nextComments = data || [];
      setComments(nextComments);
      setLocalCommentCount(countCommentTree(nextComments));
    } catch (error) {
      console.error("Failed to load comments", error);
    }
  };

  const openComments = async () => {
    setCommentsModalOpen(true);
    setEmojiOpen(false);
    await loadComments();
  };

  const handleLike = async () => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    try {
      const nextLiked = !liked;
      const nextLikes = Math.max(likes + (nextLiked ? 1 : -1), 0);

      if (liked) await unlikePost(post.id, CURRENT_USER_ID);
      else await likePost(post.id, CURRENT_USER_ID);

      setLiked(nextLiked);
      setLikes(nextLikes);
      onPostUpdated?.({ ...post, likeCount: nextLikes });
    } catch (error) {
      alert(getErrorMessage(error, "Like action failed"));
    }
  };

  const handleSaveToggle = async () => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    try {
      if (saved) await unsavePost(post.id, CURRENT_USER_ID);
      else await savePost(post.id, CURRENT_USER_ID);

      await loadSavedStatus();
    } catch (error) {
      alert(getErrorMessage(error, "Save action failed"));
    }
  };

  const handleComment = async () => {
    if (!CURRENT_USER_ID) return alert("Please login first");

    const text = commentText.trim();
    if (!text || commentSubmitting) return;

    try {
      setCommentSubmitting(true);
      await addComment(post.id, CURRENT_USER_ID, text);
      setCommentText("");
      setEmojiOpen(false);
      await loadComments();
      const nextCount = commentCount + 1;
      setLocalCommentCount(nextCount);
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      alert(getErrorMessage(error, "Comment failed"));
    } finally {
      setCommentSubmitting(false);
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
      const nextCount = commentCount + 1;
      setLocalCommentCount(nextCount);
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      alert(getErrorMessage(error, "Reply failed"));
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
      alert(getErrorMessage(error, "Comment like failed"));
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
      setComments((prev) => removeCommentFromTree(prev, deleteConfirmComment.id));
      const nextCount = Math.max(commentCount - removedCount, 0);
      setLocalCommentCount(nextCount);
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
      setDeleteConfirmComment(null);
      setCommentOptions(null);
    } catch (error) {
      alert(getErrorMessage(error, "Delete comment failed"));
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await deletePost(post.id);
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error("Delete post failed", error);
      alert("Delete failed. Please try again.");
    }
  };

  const handleUpdatePost = async () => {
    try {
      const updatedPost = await updatePost({
        postId: post.id,
        caption,
        images: [],
      });

      setEditing(false);
      setPostOptionsOpen(false);
      onPostUpdated?.({ ...post, ...updatedPost, caption });
    } catch (error) {
      alert(getErrorMessage(error, "Update failed"));
    }
  };

  const handleUpdateModalCaption = async () => {
    try {
      const updatedPost = await updatePost({
        postId: post.id,
        caption: modalCaption,
        images: [],
      });

      setCaption(modalCaption);
      setModalEditing(false);
      setPostOptionsOpen(false);
      onPostUpdated?.({ ...post, ...updatedPost, caption: modalCaption });
    } catch (error) {
      alert(getErrorMessage(error, "Update failed"));
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopyToast(true);
    setPostOptionsOpen(false);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const nextMedia = (e) => {
    e.stopPropagation();
    setMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevMedia = (e) => {
    e.stopPropagation();
    setMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const renderMedia = (contain = false) => (
    <>
      {currentMedia ? (
        currentMedia.mediaType === "VIDEO" ? (
          <>
            <video
              src={currentMedia.mediaUrl}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              controls={contain}
              className={`w-full h-full ${contain ? "object-contain" : "object-cover"}`}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              className="absolute right-3 bottom-3 z-30 rounded-full bg-black/55 p-2 text-white hover:bg-black/75"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <img
            src={currentMedia.mediaUrl}
            alt="post"
            className={`w-full h-full ${contain ? "object-contain" : "object-cover"}`}
          />
        )
      ) : (
        <p className="text-sm text-gray-400">No media</p>
      )}

      {mediaList.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevMedia}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/45 text-white rounded-full p-1.5 hover:bg-black/70 z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={nextMedia}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/45 text-white rounded-full p-1.5 hover:bg-black/70 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {mediaList.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === mediaIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );

  const renderSmallLikeText = (item) => {
    if (!item.likeCount || item.likeCount <= 0) return null;

    return (
      <span className="text-[11px] font-semibold text-gray-500">
        {item.likeCount} like{item.likeCount > 1 ? "s" : ""}
      </span>
    );
  };

  const renderHeartButton = (item) => (
    <button
      type="button"
      onClick={() => handleCommentLike(item)}
      className="ml-2 shrink-0"
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

  const shouldClampCaption = caption.length > 180;
  const visibleCaption =
    shouldClampCaption && !captionExpanded ? `${caption.slice(0, 180).trimEnd()}...` : caption;

  const renderReply = (reply, depth = 1) => {
    const replyUser = reply.user || {};
    const replies = getReplies(reply);
    const isExpanded = expandedReplies[reply.id];
    const replyUsername = replyUser.username || reply.username || "user";

    const handleStartReply = () => {
      setReplyingTo(reply);
      setReplyText(`@${replyUsername} `);
    };

    return (
      <div key={reply.id} className="flex flex-col gap-2">
        <div className="flex justify-between gap-3 group">
          <div className="flex gap-3 flex-1 min-w-0">
            <img
              src={getAvatarUrl(replyUser)}
              alt="reply user"
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
                <span className="font-semibold mr-1.5">
                  {replyUsername}
                </span>
                {reply.text}
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                <span className="text-[11px] text-gray-400">
                  {formatTimeAgo(reply.createdAt || reply.updatedAt)}
                </span>
                {renderSmallLikeText(reply)}
                <button
                  type="button"
                  className="text-[11px] font-semibold text-gray-500"
                  onClick={handleStartReply}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>

          {renderHeartButton(reply)}

          {isOwnedByCurrentUser(reply) && (
            <button
              onClick={() => setCommentOptions(reply)}
              className="opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {replyingTo?.id === reply.id && (
          <div className={`${depth < 2 ? "ml-10" : "ml-4"} mt-1 flex items-center gap-2`}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply(reply.id)}
              className="flex-grow border border-gray-200 rounded-full px-3 py-1.5 text-sm outline-none"
              placeholder="Write a reply..."
              autoFocus
            />

            <button
              type="button"
              onClick={() => handleReply(reply.id)}
              disabled={!replyText.trim()}
              className="text-[#0095f6] font-semibold text-xs disabled:opacity-40"
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
          <div className={`${depth < 2 ? "ml-10" : "ml-4"} min-w-0`}>
            {!isExpanded ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedReplies((prev) => ({ ...prev, [reply.id]: true }))
                }
                className="text-[12px] font-semibold text-gray-500"
              >
                View all {replies.length} repl{replies.length === 1 ? "y" : "ies"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-3 border-l border-gray-100 pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({ ...prev, [reply.id]: false }))
                  }
                  className="text-[12px] font-semibold text-gray-500 text-left"
                >
                  Hide replies
                </button>

                {replies.map((childReply) => renderReply(childReply, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderComment = (comment) => {
    const commentUser = comment.user || {};
    const replies = getReplies(comment);
    const isExpanded = expandedReplies[comment.id];

    return (
      <div key={comment.id} className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3 group">
          <div className="flex gap-3 flex-1 min-w-0">
            <img
              src={getAvatarUrl(commentUser)}
              alt="profile"
              className="w-8 h-8 rounded-full object-cover"
            />

            <div className="flex-1 min-w-0">
              <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
                <span className="font-semibold mr-1.5">
                  {commentUser.username || comment.username || "user"}
                </span>
                {comment.text}
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                <span className="text-[11px] text-gray-400">
                  {formatTimeAgo(comment.createdAt || comment.updatedAt)}
                </span>

                {renderSmallLikeText(comment)}

                <button
                  type="button"
                  className="text-[11px] font-semibold text-gray-500"
                  onClick={() => {
                    setReplyingTo(comment);
                    setReplyText(`@${commentUser.username || "user"} `);
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>

          {renderHeartButton(comment)}

          {isOwnedByCurrentUser(comment) && (
            <button
              onClick={() => setCommentOptions(comment)}
              className="opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {replies.length > 0 && (
          <div className="ml-11">
            {!isExpanded ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedReplies((prev) => ({ ...prev, [comment.id]: true }))
                }
                className="text-[12px] font-semibold text-gray-500"
              >
                View all {replies.length} repl{replies.length === 1 ? "y" : "ies"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-3 border-l border-gray-100 pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({ ...prev, [comment.id]: false }))
                  }
                  className="text-[12px] font-semibold text-gray-500 text-left"
                >
                  Hide replies
                </button>

                {replies.map((reply) => renderReply(reply, 1))}
              </div>
            )}
          </div>
        )}

        {replyingTo?.id === comment.id && (
          <div className="ml-11 mt-1 flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
              className="flex-grow border border-gray-200 rounded-full px-3 py-1.5 text-sm outline-none"
              placeholder="Write a reply..."
              autoFocus
            />

            <button
              type="button"
              onClick={() => handleReply(comment.id)}
              disabled={!replyText.trim()}
              className="text-[#0095f6] font-semibold text-xs disabled:opacity-40"
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
      </div>
    );
  };

  return (
    <>
      <article className="bg-white border border-[#dbdbdb] rounded-xl mb-6 overflow-hidden w-full">
        <div className="flex justify-between items-center p-3">
          <div className="flex items-center gap-3">
            <img src={profilePicture} alt="profile" className="w-9 h-9 rounded-full object-cover" />
            <div>
              <h4 className="text-[14px] font-semibold text-[#262626]">{username}</h4>
              <p className="text-[11px] text-gray-500">{fullName}</p>
            </div>
          </div>

          <button onClick={() => setPostOptionsOpen(true)}>
            <MoreHorizontal className="w-6 h-6 text-[#262626]" />
          </button>
        </div>

        <div
          className="relative w-full aspect-square bg-black overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={() => onMediaClick?.(post)}
        >
          {renderMedia(false)}
        </div>

        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-[#262626] ${
                liked ? "text-[#ed4956]" : ""
              }`}
            >
              <Heart
                className={`w-[26px] h-[26px] ${
                  liked ? "fill-[#ed4956] stroke-[#ed4956]" : ""
                }`}
              />
              <span className="text-[13px] font-semibold text-[#262626]">
                {likes}
              </span>
            </button>

            <button
              onClick={openComments}
              className="flex items-center gap-1.5 text-[#262626]"
            >
              <MessageCircle className="w-[26px] h-[26px]" />
              <span className="text-[13px] font-semibold text-[#262626]">
                {commentCount}
              </span>
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 text-[#262626]"
            >
              <Send className="w-[26px] h-[26px]" />
            </button>
          </div>

          <button onClick={handleSaveToggle} className="text-[#262626]">
            <Bookmark
              className={`w-[26px] h-[26px] ${
                saved ? "fill-[#262626] stroke-[#262626]" : ""
              }`}
            />
          </button>
        </div>

        <div className="px-3.5 pb-3">
          <p className="text-[14px] font-semibold text-[#262626] mb-1">{likes} likes</p>

          {editing ? (
            <div className="mt-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[70px] border border-[#dbdbdb] rounded-lg p-2 text-sm resize-none"
              />

              <div className="flex gap-3 mt-2">
                <button onClick={handleUpdatePost} className="text-[#0095f6] font-semibold text-xs">
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setCaption(post.caption || "");
                  }}
                  className="text-gray-500 font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[14px] leading-[19px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
              <span className="font-semibold mr-1.5">{username}</span>
              {visibleCaption}
              {shouldClampCaption && (
                <button
                  type="button"
                  onClick={() => setCaptionExpanded((prev) => !prev)}
                  className="ml-1 text-[13px] text-gray-500"
                >
                  {captionExpanded ? "less" : "more"}
                </button>
              )}
            </p>
          )}

          <button onClick={openComments} className="text-[13px] text-gray-500 mt-1.5">
            View all comments
          </button>

          <p className="text-gray-400 text-[10px] uppercase mt-2">
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
        </div>

        <div className="border-t border-gray-100 p-2 px-3.5 flex gap-2.5 items-center relative">
          <div ref={emojiRef} className="relative">
            <Smile
              className="w-[22px] h-[22px] text-gray-500 cursor-pointer"
              onClick={() => setEmojiOpen((prev) => !prev)}
            />

           {emojiOpen && (
              <div className="absolute bottom-8 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiData) =>
                    setCommentText((prev) => prev + emojiData.emoji)
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
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Add a comment..."
            className="flex-grow outline-none text-[13px]"
          />

          <button
            disabled={commentSubmitting || !commentText.trim()}
            onClick={handleComment}
            className="text-[#0095f6] font-semibold text-xs disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </article>

      {commentsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <button
            onClick={() => setCommentsModalOpen(false)}
            className="fixed right-5 top-4 z-[150] text-white"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="w-full max-w-[935px] h-[85vh] bg-white grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] rounded-xl overflow-hidden">
            <div className="relative bg-black hidden md:flex items-center justify-center overflow-hidden">
              {renderMedia(true)}
            </div>

            <div className="flex flex-col bg-white h-full">
              <div className="h-[62px] px-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={profilePicture} alt="profile" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-[14px] font-bold text-[#262626]">{username}</p>
                    <p className="text-[11px] text-gray-400">{fullName}</p>
                  </div>
                </div>

                <button onClick={() => setPostOptionsOpen(true)}>
                  <MoreHorizontal className="w-6 h-6 text-[#262626]" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-5">
                <div className="flex gap-3 pb-4 border-b border-gray-100">
                  <img src={profilePicture} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    {modalEditing ? (
                      <div>
                        <textarea
                          value={modalCaption}
                          onChange={(e) => setModalCaption(e.target.value)}
                          className="w-full min-h-[80px] border border-[#dbdbdb] rounded-lg p-2 text-sm resize-none"
                        />
                        <div className="flex gap-3 mt-2">
                          <button onClick={handleUpdateModalCaption} className="text-[#0095f6] font-semibold text-xs">
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setModalEditing(false);
                              setModalCaption(caption || "");
                            }}
                            className="text-gray-500 font-semibold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[14px] leading-[19px] text-[#262626] [overflow-wrap:anywhere] [word-break:break-word]">
                        <span className="font-bold mr-1.5">{username}</span>
                        {caption}
                      </p>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-10">No comments yet.</p>
                ) : (
                  comments.map(renderComment)
                )}
              </div>

              <div className="border-t border-gray-100 p-3">
                <p className="text-[13px] font-semibold mb-2">{likes} likes</p>

                <div className="flex gap-3 items-center relative">
                  <div ref={emojiRef} className="relative">
                    <Smile
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => setEmojiOpen((prev) => !prev)}
                    />

                    {emojiOpen && (
                      <div className="absolute bottom-8 left-0 z-50">
                        <EmojiPicker
                          onEmojiClick={(emojiData) =>
                            setCommentText((prev) => prev + emojiData.emoji)
                          }
                        />
                      </div>
                    )}
                  </div>

                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="Add a comment..."
                    className="flex-grow outline-none text-sm"
                  />

                  <button
                    disabled={commentSubmitting || !commentText.trim()}
                    onClick={handleComment}
                    className="text-[#0095f6] font-semibold text-sm disabled:opacity-40"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {postOptionsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[20000]">
          <div className="w-[360px] bg-white rounded-xl overflow-hidden text-center">
            <button className="block w-full py-4 text-[#ed4956] font-bold" onClick={handleDeletePost}>
              Delete
            </button>
            <button
              className="block w-full py-4 border-t border-gray-100 font-semibold"
              onClick={() => {
                if (commentsModalOpen) {
                  setModalCaption(caption || "");
                  setModalEditing(true);
                } else {
                  setEditing(true);
                }
                setPostOptionsOpen(false);
              }}
            >
              Edit caption
            </button>
            <button className="block w-full py-4 border-t border-gray-100 font-semibold" onClick={copyLink}>
              Copy link
            </button>
            <button className="block w-full py-4 border-t border-gray-100 text-gray-500" onClick={() => setPostOptionsOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {commentOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[21000]">
          <div className="w-[320px] bg-white rounded-xl overflow-hidden text-center">
            <button
              type="button"
              className="block w-full py-4 text-[#ed4956] font-bold"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDeleteConfirmComment(commentOptions);
                setCommentOptions(null);
              }}
            >
              Delete
            </button>
            <button type="button" className="block w-full py-4 border-t border-gray-100 text-gray-500" onClick={() => setCommentOptions(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {deleteConfirmComment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[22000]">
          <div className="w-[320px] bg-white rounded-xl overflow-hidden text-center">
            <h3 className="text-[16px] font-semibold mt-5 mb-1">Delete comment?</h3>
            <p className="text-gray-500 text-sm px-6 mb-5">This action cannot be undone.</p>
            <button type="button" className="block w-full py-4 border-t text-[#ed4956] font-bold" onClick={handleDeleteComment}>
              Delete
            </button>
            <button type="button" className="block w-full py-4 border-t text-gray-500" onClick={() => setDeleteConfirmComment(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#262626] text-white text-xs font-semibold py-2.5 px-6 rounded-md z-[23000]">
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
    </>
  );
}

export default PostCard;
