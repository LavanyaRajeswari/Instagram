import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Repeat,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ShareModal from "./ShareModal";
import { likePost, unlikePost, getLikeCount, isPostLiked } from "../api/likesApi";
import { savePost, unsavePost, isPostSaved } from "../api/savedPostsApi";
import { getShareCount } from "../api/shareApi";
import { repostPost } from "../api/postsApi";
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
import LinkedText from "./LinkedText";

const hasCommentsDisabled = (item) =>
  Boolean(
    item?.commentsDisabled ||
      item?.commentingDisabled ||
      item?.disableComments ||
      item?.user?.commentsDisabled ||
      item?.user?.commentingDisabled ||
      item?.user?.disableComments
  );

function ImmersivePostModal({
  post,
  onClose,
  onPostUpdated,
}) {
  const navigate = useNavigate();
  const { currentUserId: CURRENT_USER_ID } = useCurrentUser();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likeCount || 0);
  const [saved, setSaved] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [reposting, setReposting] = useState(false);
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [commentOptions, setCommentOptions] = useState(null);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [commentsDisabled, setCommentsDisabled] = useState(hasCommentsDisabled(post));

  const commentsContainerRef = useRef(null);
  const emojiRef = useRef(null);

  const mediaList = post?.media || [];
  const media = mediaList[mediaIndex];

  const username = post?.user?.username || "user";
  const userPic = getAvatarUrl(post?.user);
  const fullName = post?.user?.fullName || "";
  const postOwnerId = post?.user?.id ?? post?.userId;
  const isOwner = CURRENT_USER_ID != null && postOwnerId != null && String(CURRENT_USER_ID) === String(postOwnerId);
  const likesHidden = Boolean(post?.hideLikeCount);
  const commentsRestricted = commentsDisabled || hasCommentsDisabled(post);
  const showRepostButton = CURRENT_USER_ID != null && !isOwner;
  const canShowLikeCount = !likesHidden || isOwner;

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return error.message || fallback;
  };

  const showToast = (message, duration = 2000) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), duration);
  };

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
    setCommentsDisabled(hasCommentsDisabled(post));

    loadLikeData();
    loadSavedStatus();
    loadShareCount();
    loadComments();
  }, [post?.id, CURRENT_USER_ID]);

  useEffect(() => {
    setCommentsDisabled(hasCommentsDisabled(post));
  }, [post?.commentsDisabled, post?.user?.commentsDisabled]);

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
        isPostLiked(post.id),
      ]);

      setLikesCount(count);
      setLiked(status);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not post comment"));
    }
  };

  const loadSavedStatus = async () => {
    if (!post?.id || !CURRENT_USER_ID) return;

    try {
      const status = await isPostSaved(post.id);
      setSaved(status);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not post reply"));
    }
  };

  const loadShareCount = async () => {
    if (!post?.id) return;

    try {
      const count = await getShareCount(post.id);
      setShareCount(count);
    } catch {  }
  };

  const loadComments = async () => {
    if (!post?.id) return;

    try {
      const data = await getComments(post.id);
      setCommentsList(data || []);
    } catch {  }
  };

  const handleLikeToggle = async () => {
    if (!CURRENT_USER_ID) return;

    try {
      const nextLiked = !liked;
      const nextLikesCount = Math.max(likesCount + (nextLiked ? 1 : -1), 0);

      if (liked) await unlikePost(post.id);
      else await likePost(post.id);

      setLiked(nextLiked);
      setLikesCount(nextLikesCount);
      onPostUpdated?.({ ...post, likeCount: nextLikesCount });
    } catch {  }
  };

  const handleSaveToggle = async () => {
    if (!CURRENT_USER_ID) return;

    try {
      const nextSaved = !saved;
      if (saved) await unsavePost(post.id);
      else await savePost(post.id);

      setSaved(nextSaved);
      onPostUpdated?.({ ...post, isSaved: nextSaved });
    } catch {  }
  };

  const handlePostComment = async () => {
    if (!CURRENT_USER_ID) return;

    const text = newCommentText.trim();
    if (!text || !post?.id || commentsRestricted) return;

    try {
      await addComment(post.id, text);
      setNewCommentText("");
      setEmojiOpen(false);
      const nextCount = countCommentTree(commentsList) + 1;
      await loadComments();
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      if (error?.response?.status === 403) {
        onPostUpdated?.({ ...post, commentsDisabled: true });
      }
      showToast(getErrorMessage(error, "Could not post comment"));
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!CURRENT_USER_ID) return;

    const text = replyText.trim();
    if (!text || commentsRestricted) return;

    try {
      await addReply(post.id, parentCommentId, text);
      setReplyText("");
      setReplyingTo(null);
      setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
      await loadComments();
      const nextCount = countCommentTree(commentsList) + 1;
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      if (error?.response?.status === 403) {
        onPostUpdated?.({ ...post, commentsDisabled: true });
      }
      showToast(getErrorMessage(error, "Could not post reply"));
    }
  };

  const handleCommentLike = async (comment) => {
    if (!CURRENT_USER_ID) return;

    try {
      const nextLiked = !comment.likedByCurrentUser;
      const nextLikeCount = Math.max((comment.likeCount || 0) + (nextLiked ? 1 : -1), 0);
      const applyLikeState = (items = []) =>
        items.map((item) => {
          if (item.id === comment.id) {
            return {
              ...item,
              likedByCurrentUser: nextLiked,
              likeCount: nextLikeCount,
            };
          }
          return {
            ...item,
            replies: applyLikeState(getReplies(item)),
          };
        });

      setCommentsList((prev) => applyLikeState(prev));
      if (comment.likedByCurrentUser) {
        await unlikeComment(comment.id);
      } else {
        await likeComment(comment.id);
      }

      await loadComments();
    } catch (error) {
      await loadComments();
      showToast(getErrorMessage(error, "Could not update comment like"));
    }
  };

  const handleDeleteComment = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!deleteConfirmComment) return;
    if (!CURRENT_USER_ID) return;

    try {
      await deleteComment(post.id, deleteConfirmComment.id);
      const removedCount = countCommentTree([deleteConfirmComment]);
      const nextCount = Math.max(countCommentTree(commentsList) - removedCount, 0);
      setCommentsList((prev) => removeCommentFromTree(prev, deleteConfirmComment.id));
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
      setDeleteConfirmComment(null);
      setCommentOptions(null);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not delete comment"));
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post?.id || ""}`);
    setShowOptionsPopup(false);
    showToast("Link copied to clipboard!");
  };

  const handleRepost = async () => {
    if (!CURRENT_USER_ID || !post?.id || reposting || isOwner) return;

    try {
      setReposting(true);
      const reposted = await repostPost(post.id);
      showToast("Reposted to your profile");
      onPostUpdated?.(post, { reposted });
    } catch (error) {
      showToast(getErrorMessage(error, "Could not repost this post"));
    } finally {
      setReposting(false);
    }
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
      <span className="text-[11px] text-secondary font-semibold">
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
            : "text-secondary"
        }`}
      />
    </button>
  );

  const isOwnedByCurrentUser = (item) => {
    const itemUserId = item?.user?.id ?? item?.userId;
    return CURRENT_USER_ID != null && String(itemUserId) === String(CURRENT_USER_ID);
  };
  const canManageComment = (item) => isOwner || isOwnedByCurrentUser(item);

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
      if (commentsRestricted) return;
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
            <button type="button" onClick={() => navigate(`/profile/${commentUser.id || comment.userId}`)} className="shrink-0">
              <img
                src={
                  getAvatarUrl(commentUser.profilePicture ? commentUser : comment)
                }
                alt="commenter"
                className={`${
                  depth > 0 ? "w-7 h-7" : "w-8 h-8"
                } rounded-full object-cover border border-secondary shrink-0`}
                onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
            </button>

            <div className="min-w-0 flex-grow">
              <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-primary [overflow-wrap:anywhere] [word-break:break-word]">
                <span className="font-semibold mr-1.5 text-primary">
                  {username}
                </span>
                    <span className="text-primary">
                      <LinkedText text={comment.text} onLinkClick={onClose} />
                    </span>
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold">
                <span className="text-secondary">
                  {formatTimeAgo(comment.createdAt || comment.updatedAt)}
                </span>

                {renderSmallLikeText(comment)}

                <button
                  type="button"
                  disabled={commentsRestricted}
                  className="text-secondary hover:text-primary font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={handleStartReply}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>

          {renderHeartButton(comment)}

          {canManageComment(comment) && (
            <button
              type="button"
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100"
              onClick={() => setCommentOptions(comment)}
            >
              <MoreHorizontal className="w-5 h-5 text-secondary hover:text-primary" />
            </button>
          )}
        </div>

        {replyingTo?.id === comment.id && (
          <div className={`${depth > 0 ? "ml-9" : "ml-11"} mt-1 flex items-center gap-2`}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                disabled={commentsRestricted}
                placeholder="Write a reply..."
                className="flex-grow border border-primary rounded-full px-3 py-1.5 text-xs text-primary placeholder-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />

              <button
                type="button"
                onClick={() => handleReply(comment.id)}
                disabled={commentsRestricted || !replyText.trim()}
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
              className="text-secondary text-xs"
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
                className="text-[12px] font-semibold text-secondary hover:text-primary"
              >
                View all {replies.length} repl{replies.length === 1 ? "y" : "ies"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-3 border-l border-secondary pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({
                      ...prev,
                      [comment.id]: false,
                    }))
                  }
                  className="text-[12px] font-semibold text-secondary hover:text-primary text-left"
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
      className="fixed inset-0 bg-black/65 z-[60000] flex items-center justify-center font-sans text-primary overflow-hidden p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed top-4 right-4 p-2 rounded-full hover:bg-card/10 text-white cursor-pointer z-[70000]"
      >
        <X className="w-8 h-8 text-white stroke-[2]" />
      </button>

      <div
        className="relative grid h-[92vh] max-h-[900px] min-h-0 w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-md border border-primary bg-card shadow-2xl md:grid-cols-[minmax(0,1.6fr)_360px]"
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
                loading="lazy"
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
                      index === mediaIndex ? "bg-card" : "bg-card/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid h-full min-h-0 grid-rows-[62px_minmax(0,1fr)_auto] overflow-hidden border-l border-primary bg-card">
          <div className="h-[62px] px-4 border-b border-secondary flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => navigate(`/profile/${post?.user?.id}`)} className="shrink-0">
                <img
                  src={userPic}
                  alt="creator avatar"
                  className="w-8 h-8 rounded-full object-cover border border-secondary shrink-0"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                />
              </button>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-primary truncate">
                  {username}
                </p>
                {fullName && (
                  <p className="text-[11px] text-secondary truncate">
                    {fullName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptionsPopup(true)}
              className="p-1 text-primary hover:text-secondary"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={commentsContainerRef}
            className="min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4 text-left"
          >
            {post.caption && (
              <div className="flex items-start gap-3 pb-3 border-b border-secondary">
                <button type="button" onClick={() => navigate(`/profile/${post?.user?.id}`)} className="shrink-0">
                  <img
                    src={userPic}
                    alt="creator avatar"
                    className="w-8 h-8 rounded-full object-cover border border-secondary shrink-0"
                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-[14px] leading-[19px] text-primary [overflow-wrap:anywhere] [word-break:break-word]">
                    <span className="font-semibold mr-1.5">{username}</span>
                    <span><LinkedText text={post.caption} onLinkClick={onClose} /></span>
                  </p>
                  <span className="text-[11px] text-secondary">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>
              </div>
            )}

            {commentsRestricted ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="w-10 h-10 text-secondary mb-3" />
                <p className="text-[15px] font-semibold text-primary mb-1">
                  Comments are restricted
                </p>
                <p className="text-secondary text-xs">
                  Comments are restricted for this post.
                </p>
              </div>
            ) : commentsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="w-10 h-10 text-secondary mb-3" />
                <p className="text-[15px] font-semibold text-primary mb-1">
                  No comments yet
                </p>
                <p className="text-secondary text-xs">
                  Start the conversation by posting a comment.
                </p>
              </div>
            ) : (
              commentsList.map((comment) => renderComment(comment, 0))
            )}
          </div>

          <div className="border-t border-secondary shrink-0 bg-card">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleLikeToggle}
                    className={liked ? "text-[#ed4956]" : "text-primary"}
                  >
                    <Heart
                      className={`w-[26px] h-[26px] ${
                        liked ? "fill-[#ed4956] stroke-[#ed4956]" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    disabled={commentsRestricted}
                    className="text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    title={commentsRestricted ? "Comments are restricted" : undefined}
                  >
                    <MessageCircle className="w-[26px] h-[26px]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="text-primary"
                  >
                    <Send className="w-[26px] h-[26px]" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {showRepostButton && (
                    <button
                      type="button"
                      onClick={handleRepost}
                      disabled={reposting}
                      className="text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Repost"
                      title={reposting ? "Reposting..." : "Repost"}
                    >
                      <Repeat className="h-[26px] w-[26px]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveToggle}
                    className="text-primary"
                  >
                    <Bookmark
                      className={`w-[26px] h-[26px] ${
                        saved ? "fill-[#262626] stroke-[#262626]" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-[13px] font-semibold text-primary">
                {canShowLikeCount ? `${likesCount} like${likesCount === 1 ? "" : "s"}` : "Likes hidden"}
              </p>
              {shareCount > 0 && (
                <p className="mt-1 text-[11px] text-secondary">
                  {shareCount} share{shareCount === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div className="px-3 py-2 border-t border-secondary flex gap-2 items-center bg-card relative">
              <div ref={emojiRef} className="relative">
                <button
                  type="button"
                  onClick={() => !commentsRestricted && setEmojiOpen((prev) => !prev)}
                  disabled={commentsRestricted}
                  className="text-primary hover:text-secondary cursor-pointer p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
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
                disabled={commentsRestricted}
                placeholder={commentsRestricted ? "Comments are restricted" : "Add a comment..."}
                className="flex-grow px-2 py-1 text-sm placeholder-gray-400 outline-none border-none text-primary bg-transparent"
              />

              <button
                onClick={handlePostComment}
                disabled={commentsRestricted || !newCommentText.trim()}
                className="text-[#0095f6] hover:text-[#3897f0] disabled:opacity-30 text-sm font-semibold px-2"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {showOptionsPopup && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[210000] p-4"
          onClick={() => setShowOptionsPopup(false)}
        >
          <div
            className="w-full max-w-[400px] bg-card rounded-xl overflow-hidden text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full py-4 text-sm font-semibold text-primary hover:bg-secondary"
              onClick={handleCopyLink}
            >
              Copy link
            </button>

            <button
              type="button"
              className="block w-full py-4 border-t border-secondary text-sm text-secondary hover:bg-secondary"
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
            className="w-[320px] bg-card rounded-xl overflow-hidden text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full py-4 text-[#ed4956] font-bold hover:bg-secondary"
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
              className="block w-full py-4 border-t border-secondary text-secondary hover:bg-secondary"
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
            className="w-[320px] bg-card rounded-xl overflow-hidden text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-semibold text-primary mt-5 mb-1">
              Delete comment?
            </h3>
            <p className="text-secondary text-sm px-6 mb-5">
              This action cannot be undone.
            </p>

            <button
              type="button"
              className="block w-full py-4 border-t border-secondary text-[#ed4956] font-bold hover:bg-secondary"
              onClick={handleDeleteComment}
            >
              Delete
            </button>

            <button
              type="button"
              className="block w-full py-4 border-t border-secondary text-secondary hover:bg-secondary"
              onClick={() => setDeleteConfirmComment(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary shadow-xl text-white text-xs font-semibold py-2.5 px-6 rounded-md z-[240000]">
          {toastMessage}
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
