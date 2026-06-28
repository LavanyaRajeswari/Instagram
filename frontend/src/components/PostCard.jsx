import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deletePost, repostPost, updatePost } from "../api/postsApi";
import { likePost, unlikePost, getLikeCount, isPostLiked } from "../api/likesApi";
import { savePost, unsavePost, isPostSaved } from "../api/savedPostsApi";
import { getShareCount } from "../api/shareApi";
import { disableComments, enableComments, hideLikeCount, showLikeCount } from "../api/postInteractionApi";
import ShareModal from "./ShareModal";
import { followUser, unfollowUser, isFollowingUser } from "../api/followApi";
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
  Repeat,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";
import LikesModal from "./LikesModal";
import LinkedText from "./LinkedText";
import MentionSuggestions from "./MentionSuggestions";

const isEnabledFlag = (value) =>
  value === true || value === 1 || value === "true" || value === "1";

const hasCommentsDisabled = (item) =>
  [
    item?.commentsDisabled,
    item?.commentingDisabled,
    item?.disableComments,
    item?.user?.commentsDisabled,
    item?.user?.commentingDisabled,
    item?.user?.disableComments,
  ].some(isEnabledFlag);

function PostCard({ post, onPostUpdated, onPostDeleted, onMediaClick }) {
  const navigate = useNavigate();
  const { currentUserId: CURRENT_USER_ID } = useCurrentUser();

  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption || "");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likeCount || 0);
  const [saved, setSaved] = useState(false);
  const [, setShareCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
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
  const [deletePostConfirm, setDeletePostConfirm] = useState(false);
  const [captionSaving, setCaptionSaving] = useState(false);
  const [postOptionsOpen, setPostOptionsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [reposting, setReposting] = useState(false);
  const [repostConfirmOpen, setRepostConfirmOpen] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [isMuted, setIsMuted] = useState(true);
  const [commentsDisabled, setCommentsDisabled] = useState(hasCommentsDisabled(post));
  const [likesHidden, setLikesHidden] = useState(isEnabledFlag(post.hideLikeCount));

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const emojiRef = useRef(null);
  const commentInputRef = useRef(null);

  const username = post.user?.username || "user";
  const fullName = post.user?.fullName || "";
  const profilePicture = getAvatarUrl(post.user);
  const originalPostUser = post.originalPostUser;
  const originalPostUsername = originalPostUser?.username;

  const mediaList =
    post.media && post.media.length > 0
      ? post.media
      : post.imageUrls && post.imageUrls.length > 0
        ? post.imageUrls.map((url) => ({ mediaUrl: url, mediaType: "IMAGE" }))
        : [];

  const currentMedia = mediaList[mediaIndex];
  const commentCount =
    localCommentCount ?? post.commentCount ?? post.commentsCount ?? post.totalComments ?? 0;

  const postOwnerId = post.user?.id ?? post.userId;
  const showFollowButton = CURRENT_USER_ID && postOwnerId && String(CURRENT_USER_ID) !== String(postOwnerId);
  const isPostOwner = CURRENT_USER_ID != null && postOwnerId != null && String(CURRENT_USER_ID) === String(postOwnerId);
  const commentsRestricted = commentsDisabled || hasCommentsDisabled(post);
  const showRepostButton = CURRENT_USER_ID != null && !isPostOwner;
  const canShowLikeCount = !likesHidden || isPostOwner;
  const isOwnedByCurrentUser = (item) => {
    const itemUserId = item?.user?.id ?? item?.userId;
    return CURRENT_USER_ID != null && String(itemUserId) === String(CURRENT_USER_ID);
  };
  const canManageComment = (item) => isPostOwner || isOwnedByCurrentUser(item);

  const goToProfile = (userId) => {
    if (userId) navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    let active = true;
    setCaption(post.caption || "");
    setModalCaption(post.caption || "");
    setModalEditing(false);
    setCaptionExpanded(false);
    setLikes(post.likeCount || 0);
    setMediaIndex(0);
    setIsMuted(true);
    loadLikeData().then(() => { if (!active) return; });
    loadSavedStatus().then(() => { if (!active) return; });
    loadShareCount().then(() => { if (!active) return; });
    loadFollowStatus().then(() => { if (!active) return; });
    setCommentsDisabled(hasCommentsDisabled(post));
    setLikesHidden(isEnabledFlag(post.hideLikeCount));
    setRepostCount(post.repostCount || 0);
    return () => { active = false; };
  }, [post.id, CURRENT_USER_ID]);

  useEffect(() => {
    setCommentsDisabled(hasCommentsDisabled(post));
  }, [post.commentsDisabled]);

  useEffect(() => {
    setLikesHidden(isEnabledFlag(post.hideLikeCount));
  }, [post.hideLikeCount]);

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

  const showToast = (message, duration = 2000) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), duration);
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
        isPostLiked(post.id),
      ]);
      setLikes(count);
      setLiked(status);
    } catch {  }
  };

  const loadSavedStatus = async () => {
    if (!post.id || !CURRENT_USER_ID) return;

    try {
      const status = await isPostSaved(post.id);
      setSaved(status);
    } catch {  }
  };

  const loadShareCount = async () => {
    if (!post.id) return;

    try {
      const count = await getShareCount(post.id);
      setShareCount(count);
    } catch {  }
  };

  const loadComments = async () => {
    if (!post.id) return;

    try {
      const data = await getComments(post.id);
      const nextComments = data || [];
      setComments(nextComments);
      setLocalCommentCount(countCommentTree(nextComments));
    } catch {  }
  };

  const openComments = async () => {
    setCommentsModalOpen(true);
    setEmojiOpen(false);
    await loadComments();
  };

  const likingRef = useRef(false);
  const handleLike = async () => {
    if (!CURRENT_USER_ID || likingRef.current) return;
    likingRef.current = true;

    try {
      const nextLiked = !liked;
      const nextLikes = Math.max(likes + (nextLiked ? 1 : -1), 0);

      if (liked) await unlikePost(post.id);
      else await likePost(post.id);

      setLiked(nextLiked);
      setLikes(nextLikes);
      onPostUpdated?.({ ...post, likeCount: nextLikes });
    } catch {  } finally {
      likingRef.current = false;
    }
  };

  const handleSaveToggle = async () => {
    if (!CURRENT_USER_ID) return;

    try {
      if (saved) await unsavePost(post.id);
      else await savePost(post.id);

      await loadSavedStatus();
    } catch {  }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text || commentSubmitting || commentsRestricted) return;

    try {
      setCommentSubmitting(true);
      await addComment(post.id, text);
      setCommentText("");
      setEmojiOpen(false);
      await loadComments();
      const nextCount = commentCount + 1;
      setLocalCommentCount(nextCount);
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      if (error?.response?.status === 403) {
        setCommentsDisabled(true);
        onPostUpdated?.({ ...post, commentsDisabled: true });
      }
      showToast(getErrorMessage(error, "Could not post comment"));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId) => {
    const text = replyText.trim();
    if (!text || commentsRestricted) return;

    try {
      await addReply(post.id, parentCommentId, text);
      setReplyText("");
      setReplyingTo(null);
      setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));
      await loadComments();
      const nextCount = commentCount + 1;
      setLocalCommentCount(nextCount);
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
    } catch (error) {
      if (error?.response?.status === 403) {
        setCommentsDisabled(true);
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

      setComments((prev) => applyLikeState(prev));
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
      setComments((prev) => removeCommentFromTree(prev, deleteConfirmComment.id));
      const nextCount = Math.max(commentCount - removedCount, 0);
      setLocalCommentCount(nextCount);
      onPostUpdated?.({ ...post, commentCount: nextCount, commentsCount: nextCount });
      setDeleteConfirmComment(null);
      setCommentOptions(null);
    } catch (error) {
      showToast(getErrorMessage(error, "Could not delete comment"));
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostConfirm) {
      setDeletePostConfirm(true);
      setPostOptionsOpen(false);
      return;
    }
    try {
      await deletePost(post.id);
      setDeletePostConfirm(false);
      onPostDeleted?.(post.id);
    } catch {}
  };

  const handleUpdatePost = async () => {
    setCaptionSaving(true);
    try {
      const updatedPost = await updatePost({
        postId: post.id,
        caption,
        images: [],
      });

      setEditing(false);
      setPostOptionsOpen(false);
      onPostUpdated?.({ ...post, ...updatedPost, caption });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save caption");
    } finally {
      setCaptionSaving(false);
    }
  };

  const handleUpdateModalCaption = async () => {
    setCaptionSaving(true);
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
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save caption");
    } finally {
      setCaptionSaving(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(new URL(`/post/${post.id}`, window.location.origin).href);
    setPostOptionsOpen(false);
    showToast("Link copied to clipboard!");
  };

  const handleRepost = async () => {
    if (!CURRENT_USER_ID || reposting || isPostOwner) return;
    setRepostConfirmOpen(true);
  };

  const confirmRepost = async () => {
    if (!CURRENT_USER_ID || reposting || isPostOwner) return;

    try {
      setReposting(true);
      const reposted = await repostPost(post.id);
      const nextRepostCount = repostCount + 1;
      setRepostCount(nextRepostCount);
      setRepostConfirmOpen(false);
      showToast("Reposted to your profile");
      onPostUpdated?.({ ...post, repostCount: nextRepostCount }, { reposted });
    } catch (error) {
      showToast(getErrorMessage(error, "Could not repost this post"));
    } finally {
      setReposting(false);
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
              className={contain ? "h-full w-full object-contain" : "w-full h-full object-cover"}
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
            loading="lazy"
            className={contain ? "h-full w-full object-contain" : "w-full h-full object-cover"}
          />
        )
      ) : (
        <p className="text-sm text-secondary">No media</p>
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
                  i === mediaIndex ? "bg-card" : "bg-card/40"
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
      <span className="text-[11px] font-semibold text-secondary">
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
            : "text-secondary"
        }`}
      />
    </button>
  );

  const loadFollowStatus = async () => {
    if (!CURRENT_USER_ID || !postOwnerId) return;
    if (String(CURRENT_USER_ID) === String(postOwnerId)) return;

    try {
      const status = await isFollowingUser(postOwnerId);
      setFollowing(status);
    } catch {  }
  };

  const handleToggleComments = async () => {
    const next = !commentsDisabled;
    setCommentsDisabled(next);
    setPostOptionsOpen(false);
    try {
      if (next) await disableComments(post.id);
      else await enableComments(post.id);
      onPostUpdated?.({ ...post, commentsDisabled: next });
    } catch {
      setCommentsDisabled(!next);
    }
  };

  const handleToggleLikes = async () => {
    const next = !likesHidden;
    setLikesHidden(next);
    setPostOptionsOpen(false);
    try {
      if (next) await hideLikeCount(post.id);
      else await showLikeCount(post.id);
      onPostUpdated?.({ ...post, hideLikeCount: next });
    } catch {
      setLikesHidden(!next);
    }
  };

  const handleFollowToggle = async () => {
    if (!CURRENT_USER_ID) return;
    if (!postOwnerId) return;

    try {
      setFollowLoading(true);

      if (following) {
        await unfollowUser(postOwnerId);
        setFollowing(false);
      } else {
        await followUser(postOwnerId);
        setFollowing(true);
      }
    } catch {  } finally {
      setFollowLoading(false);
    }
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

  const shouldClampCaption = caption.length > 180;
  const visibleCaption =
    shouldClampCaption && !captionExpanded ? `${caption.slice(0, 180).trimEnd()}...` : caption;
  const commentMentionMatch = commentText.match(/@([A-Za-z0-9_]*)$/);
  const commentMentionQuery = commentMentionMatch ? commentMentionMatch[1] : "";

  const insertCommentMention = (user) => {
    setCommentText((prev) => prev.replace(/@([A-Za-z0-9_]*)$/, `@${user.username} `));
    requestAnimationFrame(() => commentInputRef.current?.focus());
  };

  const renderReply = (reply, depth = 1) => {
    const replyUser = reply.user || {};
    const replies = getReplies(reply);
    const isExpanded = expandedReplies[reply.id];
    const replyUsername = replyUser.username || reply.username || "user";

    const handleStartReply = () => {
      if (commentsRestricted) return;
      setReplyingTo(reply);
      setReplyText(`@${replyUsername} `);
    };

    return (
      <div key={reply.id} className="flex flex-col gap-2">
        <div className="flex justify-between gap-3 group">
          <div className="flex gap-3 flex-1 min-w-0">
            <button type="button" onClick={() => goToProfile(replyUser.id || reply.userId)} className="shrink-0">
              <img
                src={getAvatarUrl(replyUser)}
                alt="reply user"
                className="w-7 h-7 rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
            </button>

            <div className="flex-1 min-w-0">
              <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-primary [overflow-wrap:anywhere] [word-break:break-word]">
                <button type="button" onClick={() => goToProfile(replyUser.id || reply.userId)} className="font-semibold mr-1.5">
                  {replyUsername}
                </button>
                <LinkedText text={reply.text} />
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                <span className="text-[11px] text-secondary">
                  {formatTimeAgo(reply.createdAt || reply.updatedAt)}
                </span>
                {renderSmallLikeText(reply)}
                <button
                  type="button"
                  className="text-[11px] font-semibold text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={handleStartReply}
                  disabled={commentsRestricted}
                >
                  Reply
                </button>
              </div>
            </div>
          </div>

          {renderHeartButton(reply)}

          {canManageComment(reply) && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCommentOptions(reply);
              }}
              className="opacity-0 group-hover:opacity-100"
              aria-label="Comment options"
            >
              <MoreHorizontal className="w-5 h-5 text-secondary" />
            </button>
          )}
        </div>

        {replyingTo?.id === reply.id && (
          <div className={`${depth < 2 ? "ml-10" : "ml-4"} mt-1 flex items-center gap-2`}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply(reply.id)}
              disabled={commentsRestricted}
              className="flex-grow border border-primary rounded-full px-3 py-1.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Write a reply..."
              autoFocus
            />

            <button
              type="button"
              onClick={() => handleReply(reply.id)}
              disabled={commentsRestricted || !replyText.trim()}
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
              className="text-secondary text-xs"
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
                className="text-[12px] font-semibold text-secondary"
              >
                View all {replies.length} repl{replies.length === 1 ? "y" : "ies"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-3 border-l border-secondary pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({ ...prev, [reply.id]: false }))
                  }
                  className="text-[12px] font-semibold text-secondary text-left"
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
            <button type="button" onClick={() => goToProfile(commentUser.id || comment.userId)} className="shrink-0">
              <img
                src={getAvatarUrl(commentUser)}
                alt="profile"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
            </button>

            <div className="flex-1 min-w-0">
              <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-primary [overflow-wrap:anywhere] [word-break:break-word]">
                <button type="button" onClick={() => goToProfile(commentUser.id || comment.userId)} className="font-semibold mr-1.5">
                  {commentUser.username || comment.username || "user"}
                </button>
                <LinkedText text={comment.text} />
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                <span className="text-[11px] text-secondary">
                  {formatTimeAgo(comment.createdAt || comment.updatedAt)}
                </span>

                {renderSmallLikeText(comment)}

                <button
                  type="button"
                  className="text-[11px] font-semibold text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => {
                    if (commentsRestricted) return;
                    setReplyingTo(comment);
                    setReplyText(`@${commentUser.username || "user"} `);
                  }}
                  disabled={commentsRestricted}
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
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setCommentOptions(comment);
              }}
              className="opacity-0 group-hover:opacity-100"
              aria-label="Comment options"
            >
              <MoreHorizontal className="w-5 h-5 text-secondary" />
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
                className="text-[12px] font-semibold text-secondary"
              >
                View all {replies.length} repl{replies.length === 1 ? "y" : "ies"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-3 border-l border-secondary pl-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReplies((prev) => ({ ...prev, [comment.id]: false }))
                  }
                  className="text-[12px] font-semibold text-secondary text-left"
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
              className="flex-grow border border-primary rounded-full px-3 py-1.5 text-sm outline-none"
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
              className="text-secondary text-xs"
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
      <article className="bg-card border border-primary rounded-xl mb-6 overflow-hidden w-full">
        {originalPostUsername && (
          <div className="flex items-center gap-2 border-b border-primary px-3 py-2 text-[12px] font-semibold text-secondary">
            <Repeat className="h-4 w-4" />
            <span>
              {username} reposted from{" "}
              <button
                type="button"
                onClick={() => goToProfile(originalPostUser?.id)}
                className="text-primary"
              >
                {originalPostUsername}
              </button>
            </span>
          </div>
        )}

        <div className="flex justify-between items-center p-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => goToProfile(postOwnerId)} className="shrink-0">
              <img src={profilePicture} alt="profile" className="w-9 h-9 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
            </button>
            <div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => goToProfile(postOwnerId)} className="text-[14px] font-semibold text-primary">
                    {username}
                  </button>

                  {showFollowButton && (
                    <>
                      <span className="text-secondary">•</span>
                      <button
                        type="button"
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`text-[13px] font-semibold disabled:opacity-50 ${
                          following ? "text-secondary" : "text-[#0095f6]"
                        }`}
                      >
                        {following ? "Following" : "Follow"}
                      </button>
                    </>
                  )}
                </div>
              <p className="text-[11px] text-secondary">{fullName}</p>
            </div>
          </div>

          <button onClick={() => setPostOptionsOpen(true)}>
            <MoreHorizontal className="w-6 h-6 text-primary" />
          </button>
        </div>

        <div
          className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden bg-black max-h-[75vh]"
          onClick={() => onMediaClick?.(post)}
        >
          {renderMedia(false)}
        </div>

        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-primary ${
                liked ? "text-[#ed4956]" : ""
              }`}
            >
              <Heart
                className={`w-[26px] h-[26px] ${
                  liked ? "fill-[#ed4956] stroke-[#ed4956]" : ""
                }`}
              />
              <span className="text-[13px] font-semibold text-primary">
                {canShowLikeCount ? likes : ""}
              </span>
            </button>

            <button
              onClick={commentsRestricted ? undefined : openComments}
              disabled={commentsRestricted}
              className="flex items-center gap-1.5 text-primary disabled:cursor-not-allowed disabled:opacity-40"
              title={commentsRestricted ? "Comments are restricted" : undefined}
            >
              <MessageCircle className="w-[26px] h-[26px]" />
              <span className="text-[13px] font-semibold text-primary">
                {commentCount}
              </span>
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 text-primary"
            >
              <Send className="w-[26px] h-[26px]" />
            </button>
          </div>

          <div className="flex items-center gap-5">
            {showRepostButton && (
              <button
                type="button"
                onClick={handleRepost}
                disabled={reposting}
                className="flex items-center gap-1.5 text-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Repost"
                title={reposting ? "Reposting..." : "Repost"}
              >
                <Repeat className="h-[26px] w-[26px]" />
                <span className="text-[13px] font-semibold text-primary">
                  {repostCount}
                </span>
              </button>
            )}

            <button onClick={handleSaveToggle} className="text-primary">
              <Bookmark
                className={`w-[26px] h-[26px] ${
                  saved ? "fill-[#262626] stroke-[#262626]" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-3.5 pb-3">
          <button
            type="button"
            onClick={() => setLikesModalOpen(true)}
            disabled={!canShowLikeCount}
            className="mb-1 text-[14px] font-semibold text-primary disabled:cursor-default"
          >
            {canShowLikeCount ? `${likes} likes` : "Likes hidden"}
          </button>

          {editing ? (
            <div className="mt-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[70px] border border-primary rounded-lg p-2 text-sm resize-none"
              />

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={handleUpdatePost} disabled={captionSaving} className="text-[#0095f6] font-semibold text-xs disabled:opacity-50">
                  {captionSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setCaption(post.caption || "");
                  }}
                  className="text-secondary font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[14px] leading-[19px] text-primary [overflow-wrap:anywhere] [word-break:break-word]">
              <button type="button" onClick={() => goToProfile(postOwnerId)} className="font-semibold mr-1.5">
                {username}
              </button>
              <LinkedText text={visibleCaption} />
              {shouldClampCaption && (
                <button
                  type="button"
                  onClick={() => setCaptionExpanded((prev) => !prev)}
                  className="ml-1 text-[13px] text-secondary"
                >
                  {captionExpanded ? "less" : "more"}
                </button>
              )}
            </p>
          )}

          <button onClick={commentsRestricted ? undefined : openComments} disabled={commentsRestricted} className="text-[13px] text-secondary mt-1.5 disabled:cursor-default">
            {commentsRestricted ? "Comments are restricted" : "View all comments"}
          </button>

          <p className="text-secondary text-[10px] uppercase mt-2">
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
        </div>

        {commentsRestricted ? (
          <div className="border-t border-primary px-3.5 py-3 text-center text-xs font-semibold text-secondary">
            Comments are restricted for this post.
          </div>
        ) : (
          <div className="border-t border-primary p-2 px-3.5 flex gap-2.5 items-center relative">
            <div ref={emojiRef} className="relative">
              <Smile
                className="w-[22px] h-[22px] cursor-pointer text-secondary"
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
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleComment();
                }
              }}
              placeholder="Add a comment..."
              className="flex-grow outline-none text-[13px]"
            />
            <MentionSuggestions query={commentMentionQuery} active={Boolean(commentMentionMatch)} onSelect={insertCommentMention} />

            <button
              disabled={commentSubmitting || !commentText.trim()}
              type="button"
              onClick={handleComment}
              className="text-[#0095f6] font-semibold text-xs disabled:opacity-40"
            >
              Post
            </button>
          </div>
        )}
      </article>

      {commentsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <button
            onClick={() => setCommentsModalOpen(false)}
            className="fixed right-5 top-4 z-[150] text-white"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="w-full max-w-[935px] h-[85vh] bg-card grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] rounded-xl overflow-hidden">
            <div className="relative bg-black hidden md:flex items-center justify-center overflow-hidden">
              {renderMedia(true)}
            </div>

            <div className="flex flex-col bg-card h-full">
              <div className="h-[62px] px-4 border-b border-primary flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => goToProfile(postOwnerId)} className="shrink-0">
                    <img src={profilePicture} alt="profile" className="w-9 h-9 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                  </button>
                  <div>
                    <button type="button" onClick={() => goToProfile(postOwnerId)} className="text-[14px] font-bold text-primary">{username}</button>
                    <p className="text-[11px] text-secondary">{fullName}</p>
                  </div>
                </div>

                <button onClick={() => setPostOptionsOpen(true)}>
                  <MoreHorizontal className="w-6 h-6 text-primary" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-5">
                <div className="flex gap-3 pb-4 border-b border-primary">
                  <button type="button" onClick={() => goToProfile(postOwnerId)} className="shrink-0">
                    <img src={profilePicture} alt="profile" className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                  </button>
                  <div className="min-w-0 flex-1">
                    {modalEditing ? (
                      <div>
                        <textarea
                          value={modalCaption}
                          onChange={(e) => setModalCaption(e.target.value)}
                          className="w-full min-h-[80px] border border-primary rounded-lg p-2 text-sm resize-none"
                        />
                        <div className="flex gap-3 mt-2">
                          <button type="button" onClick={handleUpdateModalCaption} disabled={captionSaving} className="text-[#0095f6] font-semibold text-xs disabled:opacity-50">
                            {captionSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalEditing(false);
                              setModalCaption(caption || "");
                            }}
                            className="text-secondary font-semibold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[14px] leading-[19px] text-primary [overflow-wrap:anywhere] [word-break:break-word]">
                        <button type="button" onClick={() => goToProfile(postOwnerId)} className="font-bold mr-1.5">{username}</button>
                        <LinkedText text={caption} />
                      </p>
                    )}
                    <span className="text-[11px] text-secondary">
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <p className="text-secondary text-xs text-center py-10">No comments yet.</p>
                ) : (
                  comments.map(renderComment)
                )}
              </div>

              <div className="border-t border-primary p-3">
                <button type="button" onClick={() => setLikesModalOpen(true)} disabled={!canShowLikeCount} className="mb-2 text-[13px] font-semibold disabled:cursor-default">
                  {canShowLikeCount ? `${likes} likes` : "Likes hidden"}
                </button>

                {commentsRestricted && (
                  <p className="mb-2 text-xs font-semibold text-secondary">Comments are restricted for this post.</p>
                )}

                {commentsRestricted ? (
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-center text-xs font-semibold text-secondary">
                    Comments are restricted for this post.
                  </div>
                ) : (
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
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                      placeholder="Add a comment..."
                      className="flex-grow outline-none text-sm"
                    />
                    <MentionSuggestions query={commentMentionQuery} active={Boolean(commentMentionMatch)} onSelect={insertCommentMention} />

                    <button
                      disabled={commentSubmitting || !commentText.trim()}
                      type="button"
                      onClick={handleComment}
                      className="text-[#0095f6] font-semibold text-sm disabled:opacity-40"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {postOptionsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[20000]">
          <div className="w-[360px] bg-card rounded-xl overflow-hidden text-center">
            {isOwnedByCurrentUser(post) && (
              <>
                <button className="block w-full py-4 text-[#ed4956] font-bold" onClick={handleDeletePost}>
                  Delete
                </button>
                <button
                  className="block w-full py-4 border-t border-primary font-semibold"
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
                <button className="block w-full py-4 border-t border-primary font-semibold" onClick={handleToggleComments}>
                  {commentsDisabled ? "Turn on commenting" : "Turn off commenting"}
                </button>
                <button className="block w-full py-4 border-t border-primary font-semibold" onClick={handleToggleLikes}>
                  {likesHidden ? "Show like count" : "Hide like count"}
                </button>
              </>
            )}
            <button className={`block w-full py-4 ${isOwnedByCurrentUser(post) ? "border-t border-primary" : ""} font-semibold`} onClick={copyLink}>
              Copy link
            </button>
            <button className="block w-full py-4 border-t border-primary font-semibold" onClick={() => { setPostOptionsOpen(false); navigate(`/post/${post.id}`); }}>
              Go to post
            </button>

            <button className="block w-full py-4 border-t border-primary text-secondary" onClick={() => setPostOptionsOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {repostConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[22000] p-4">
          <div className="w-full max-w-[420px] bg-card rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <Repeat className="h-5 w-5" />
                Repost this post?
              </div>

              <div className="overflow-hidden rounded-lg border border-primary">
                <div className="flex items-center gap-3 p-3">
                  <img
                    src={profilePicture}
                    alt="profile"
                    className="h-9 w-9 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.onerror = null; }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{username}</p>
                    <p className="truncate text-xs text-secondary">{fullName}</p>
                  </div>
                </div>

                <div className="flex max-h-[320px] items-center justify-center bg-black">
                  {currentMedia?.mediaType === "VIDEO" ? (
                    <video src={currentMedia.mediaUrl} muted playsInline className="max-h-[320px] w-full object-contain" />
                  ) : currentMedia ? (
                    <img src={currentMedia.mediaUrl} alt="post preview" loading="lazy" className="max-h-[320px] w-full object-contain" />
                  ) : (
                    <p className="p-8 text-sm text-white">No media</p>
                  )}
                </div>

                {caption && (
                  <p className="p-3 text-sm leading-5 text-primary [overflow-wrap:anywhere] [word-break:break-word]">
                    <span className="font-semibold">{username}</span> <LinkedText text={caption} />
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={confirmRepost}
              disabled={reposting}
              className="block w-full border-t border-primary py-4 text-center text-sm font-bold text-[#0095f6] disabled:opacity-50"
            >
              {reposting ? "Reposting..." : "Repost"}
            </button>
            <button
              type="button"
              onClick={() => setRepostConfirmOpen(false)}
              disabled={reposting}
              className="block w-full border-t border-primary py-4 text-center text-sm font-semibold text-secondary disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {commentOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[21000]">
          <div className="w-[320px] bg-card rounded-xl overflow-hidden text-center">
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
            <button type="button" className="block w-full py-4 border-t border-primary text-secondary" onClick={() => setCommentOptions(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {deleteConfirmComment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[22000]">
          <div className="w-[320px] bg-card rounded-xl overflow-hidden text-center">
            <h3 className="text-[16px] font-semibold mt-5 mb-1">Delete comment?</h3>
            <p className="text-secondary text-sm px-6 mb-5">This action cannot be undone.</p>
            <button type="button" className="block w-full py-4 border-t border-primary text-[#ed4956] font-bold" onClick={handleDeleteComment}>
              Delete
            </button>
            <button type="button" className="block w-full py-4 border-t border-primary text-secondary" onClick={() => setDeleteConfirmComment(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {deletePostConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[23000]">
          <div className="w-[320px] bg-card rounded-xl overflow-hidden text-center">
            <h3 className="text-[16px] font-semibold mt-5 mb-1">Delete post?</h3>
            <p className="text-secondary text-sm px-6 mb-5">This action cannot be undone.</p>
            <button type="button" className="block w-full py-4 border-t border-primary text-[#ed4956] font-bold" onClick={handleDeletePost}>
              Delete
            </button>
            <button type="button" className="block w-full py-4 border-t border-primary text-secondary" onClick={() => setDeletePostConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary text-white text-xs font-semibold py-2.5 px-6 rounded-md z-[23000]">
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

      {likesModalOpen && (
        <LikesModal
          postId={post.id}
          currentUserId={CURRENT_USER_ID}
          onClose={() => setLikesModalOpen(false)}
        />
      )}


    </>
  );
}

export default PostCard;
