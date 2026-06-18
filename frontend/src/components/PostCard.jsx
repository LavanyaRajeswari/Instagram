import { useState } from "react";
import { deletePost, updatePost } from "../api/postsApi";
import { likePost, unlikePost } from "../api/likesApi";
import EmojiPicker from "emoji-picker-react";
import { getComments, addComment, updateComment, deleteComment } from "../api/commentsApi";

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  X,
  Smile,
  MoreHorizontal,
} from "lucide-react";

function PostCard({ post, onRefresh, onMediaClick }) {
  const activeUser = JSON.parse(
    localStorage.getItem("currentUser") ||
      '{"id":1,"username":"lavanya","fullName":"Lavanya","profilePicture":"https://i.pravatar.cc/100?img=5"}'
  );
  const CURRENT_USER_ID = activeUser?.id || 1;

  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption || "");
  const [liked, setLiked] = useState(post.likedByCurrentUser || false);
  const [likes, setLikes] = useState(post.likeCount || 0);

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [postOptionsToast, setPostOptionsToast] = useState(false);

  // Advanced comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentMenuOpenId, setCommentMenuOpenId] = useState(null); // stores the full comment object to edit/delete

  // Post edit file states
  const [editImages, setEditImages] = useState([]);
  const [editPreview, setEditPreview] = useState("");

  const [isFollowingCreator, setIsFollowingCreator] = useState(() => {
    const targetUserId = post.user?.id || post.userId || 1;
    const follows = JSON.parse(localStorage.getItem("followed_users") || "[]");
    return follows.includes(targetUserId);
  });

  const handleFollowCreatorToggle = () => {
    const targetUserId = post.user?.id || post.userId || 1;
    let follows = JSON.parse(localStorage.getItem("followed_users") || "[]");
    if (isFollowingCreator) {
      follows = follows.filter(id => id !== targetUserId);
      setIsFollowingCreator(false);
    } else {
      follows.push(targetUserId);
      setIsFollowingCreator(true);
    }
    localStorage.setItem("followed_users", JSON.stringify(follows));
  };

  const username = post.user?.username || post.username || "user";

  const handleEmojiClick = (emojiData) => {
    setCommentText((prev) => prev + emojiData.emoji);
    setEmojiOpen(false);
  };

  const profilePicture =
    post.user?.profilePicture ||
    post.profilePicture ||
    "https://i.pravatar.cc/100?img=12";

  const image =
    post.media?.[0]?.mediaUrl ||
    post.imageUrls?.[0] ||
    post.images?.[0]?.imageUrl ||
    "https://via.placeholder.com/500";

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;

    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return error.message || fallback;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "now";

    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;

    const years = Math.floor(days / 365);
    return `${years}y`;
  };

  const loadComments = async () => {
    const data = await getComments(post.id);
    setComments(data);
  };

  const openComments = async () => {
    try {
      setCommentsModalOpen(true);
      await loadComments();
    } catch (error) {
      alert(getErrorMessage(error, "Failed to load comments"));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await deletePost(post.id);
      onRefresh();
    } catch (error) {
      alert(getErrorMessage(error, "Delete failed"));
    }
  };

  const handleUpdate = async () => {
    try {
      await updatePost({
        postId: post.id,
        caption,
        images: editImages,
      });

      setEditing(false);
      setEditImages([]);
      setEditPreview("");
      setMenuOpen(false);
      onRefresh();
    } catch (error) {
      alert(getErrorMessage(error, "Update failed"));
    }
  };

  const handleLike = async () => {
    try {
      if (!liked) {
        await likePost(post.id, CURRENT_USER_ID);
        setLiked(true);
        setLikes((prev) => prev + 1);
      } else {
        await unlikePost(post.id, CURRENT_USER_ID);
        setLiked(false);
        setLikes((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      alert(getErrorMessage(error, "Like action failed"));
    }
  };

  const handleComment = async () => {
    const text = commentText.trim();

    if (!text || commentSubmitting) return;

    try {
      setCommentSubmitting(true);

      const savedComment = await addComment(post.id, CURRENT_USER_ID, text);

      setComments((prev) => {
        const alreadyExists = prev.some((comment) => comment.id === savedComment.id);
        return alreadyExists ? prev : [...prev, savedComment];
      });

      setCommentText("");
      // Refresh comment counts/displays
      await loadComments();
    } catch (error) {
      alert(getErrorMessage(error, "Comment failed"));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error) {
      alert(getErrorMessage(error, "Delete comment failed"));
    }
  };

  return (
    <>
      <article className="bg-white border border-[#dbdbdb] rounded-xl mb-6 overflow-hidden w-full max-w-full" id={`post-card-${post.id}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-3">
          <div className="flex items-center gap-3">
            <img src={profilePicture} alt="profile" className="w-9 h-9 rounded-full object-cover border border-gray-100" />
            <div>
              <h4 className="text-[14px] font-semibold text-[#262626] leading-snug">{username}</h4>
              <p className="text-[11px] text-gray-500 leading-none">Original audio</p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              className="text-[#262626] text-xl font-bold hover:opacity-50 px-2 pb-1.5 leading-none transition-opacity focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              id={`post-menu-btn-${post.id}`}
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 w-[120px] bg-white border border-[#dbdbdb] shadow-lg rounded-lg overflow-hidden z-20" id={`post-dropdown-${post.id}`}>
                <button
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-[#262626] hover:bg-gray-50 transition-colors"
                  onClick={() => setEditing(true)}
                  id={`post-edit-btn-${post.id}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 font-semibold transition-colors border-t border-gray-100"
                  onClick={handleDelete}
                  id={`post-delete-btn-${post.id}`}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Media Block */}
        <div
          className="w-full aspect-square bg-[#fafafa] overflow-hidden flex items-center justify-center cursor-pointer hover:brightness-[0.97] active:brightness-[0.95] transition-all"
          onClick={() => {
            if (typeof onMediaClick === "function") {
              onMediaClick(post);
            }
          }}
          title="Click to open immersive post details"
        >
          <img src={image} alt="post" className="w-full h-full object-cover" />
        </div>

        {/* Actions bar */}
        <div className="flex justify-between items-center p-3 pb-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`p-1 cursor-pointer transition-all duration-200 active:scale-75 ${
                liked ? "text-[#ed4956]" : "text-[#262626] hover:text-gray-500"
              }`}
              onClick={handleLike}
              id={`like-btn-${post.id}`}
            >
              <Heart className={`w-[26px] h-[26px] ${liked ? "fill-[#ed4956] stroke-[#ed4956]" : ""}`} />
            </button>

            <button
              type="button"
              className="p-1 text-[#262626] hover:text-gray-500 transition-colors cursor-pointer"
              onClick={openComments}
              id={`open-comments-btn-${post.id}`}
            >
              <MessageCircle className="w-[26px] h-[26px]" />
            </button>

            <button type="button" className="p-1 text-[#262626] hover:text-gray-500 transition-colors cursor-pointer">
              <Send className="w-[26px] h-[26px]" />
            </button>
          </div>

          <button type="button" className="p-1 text-[#262626] hover:text-gray-500 transition-colors cursor-pointer">
            <Bookmark className="w-[26px] h-[26px]" />
          </button>
        </div>

        {/* Caption & Metadata */}
        <div className="px-3.5 pb-3">
          <p className="text-[14px] font-semibold text-[#262626] mb-1">{likes} likes</p>

          {editing ? (
            <div className="mt-2" id={`edit-box-${post.id}`}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[70px] border border-[#dbdbdb] rounded-lg p-2 text-sm focus:outline-none resize-none mb-2 text-[#262626]"
              />
              
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                  Replace image/content (optional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setEditImages(files);
                      setEditPreview(URL.createObjectURL(files[0]));
                    }
                  }}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
                {editPreview && (
                  <div className="mt-1.5 h-16 w-16 border rounded bg-gray-50 overflow-hidden">
                    <img src={editPreview} alt="edit preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-[#0095f6] font-semibold text-xs hover:text-[#005f9e]"
                  onClick={handleUpdate}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="text-gray-500 font-semibold text-xs hover:text-gray-700"
                  onClick={() => {
                    setEditing(false);
                    setEditImages([]);
                    setEditPreview("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[14px] leading-relaxed text-[#262626]">
              <span className="font-semibold mr-1.5">{username}</span>
              <span>{post.caption}</span>
            </div>
          )}

          {/* Load Comments Trigger */}
          <button
            type="button"
            onClick={openComments}
            className="text-[13px] text-gray-500 hover:text-gray-600 font-medium mt-1.5 cursor-pointer block"
          >
            View all comments
          </button>

          <p className="text-gray-400 text-[10px] uppercase tracking-wide font-medium mt-2">
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })
              : "Today"}
          </p>
        </div>

        {/* Inline Comment Box */}
        <div className="border-t border-gray-100 p-2 px-3.5 flex gap-2.5 items-center bg-white justify-between">
          <Smile className="w-[22px] h-[22px] text-gray-500 cursor-pointer hover:text-gray-700 flex-shrink-0" />
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleComment();
            }}
            placeholder="Add a comment..."
            className="flex-grow border-none outline-none text-[13px] bg-transparent text-[#262626] h-8 focus:ring-0 placeholder-gray-400"
          />
          <button
            type="button"
            disabled={commentSubmitting || !commentText.trim()}
            onClick={handleComment}
            className="text-[#0095f6] font-semibold text-xs disabled:opacity-40 hover:text-[#005f9e] transition-colors"
          >
            Post
          </button>
        </div>
      </article>

      {/* Comments Full-Screen Dialog (Instagram Style) */}
      {commentsModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" id={`comments-modal-backdrop-${post.id}`}>
          <button
            type="button"
            onClick={() => setCommentsModalOpen(false)}
            className="fixed right-5 top-4 z-[150] text-white hover:scale-110 transition-all"
            title="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="w-full max-w-[935px] h-[90vh] md:h-[80vh] max-h-[850px] bg-white grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] rounded-xl overflow-hidden shadow-2xl animate-scale-up" id="comments-modal-container">
            {/* Left Column (Desktop image) */}
            <div className="bg-black hidden md:flex items-center justify-center overflow-hidden border-r border-[#dbdbdb]">
              <img src={image} alt="post media" className="w-full h-full object-contain" />
            </div>

            {/* Right Column (Comments scroll and inputs) */}
            <div className="flex flex-col bg-white min-w-0 h-full justify-between">
              {/* Header */}
              <div className="h-[62px] px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0" id={`comments-modal-header-${post.id}`}>
                <div className="flex items-center gap-3 text-left">
                  <img src={profilePicture} alt="profile" className="w-[34px] h-[34px] rounded-full object-cover border border-[#dbdbdb] p-[0.5px]" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="text-[14px] font-bold text-[#262626]">{username}</span>
                      <span className="text-gray-400 text-xs">•</span>
                      <button
                        type="button"
                        onClick={handleFollowCreatorToggle}
                        className={`font-semibold text-xs transition-colors cursor-pointer ${isFollowingCreator ? "text-gray-500 hover:text-black" : "text-[#0095f6] hover:text-[#005a9e]"}`}
                      >
                        {isFollowingCreator ? "Following" : "Follow"}
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium leading-none mt-1">
                      {post.user?.fullName || post.fullName || "Aditya University"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostOptions(true)}
                  className="text-[#262626] hover:text-gray-600 transition-colors cursor-pointer"
                  title="Options menu"
                >
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-5 text-left">
                {/* Pinned main post caption (postmatter) as the first item inside scrolling area */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <img
                    src={profilePicture}
                    alt="profile"
                    className="w-8 h-8 rounded-full object-cover border border-[#dbdbdb] p-[0.5px] mt-0.5 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-grow">
                    <p className="text-[#262626] text-sm leading-tight">
                      <span className="font-bold mr-1.5">{username}</span>
                      <span className="break-words text-gray-800 whitespace-pre-line">{post.caption || "No caption added."}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-gray-400 font-semibold select-none">
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-10 font-normal">No other comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div className="flex items-start gap-4 text-sm justify-between group" key={comment.id}>
                      <div className="flex items-start gap-3 flex-grow min-w-0">
                        <img
                          src={comment.profilePicture || "https://i.pravatar.cc/100?img=15"}
                          alt="profile"
                          className="w-8 h-8 rounded-full object-cover border border-gray-100 mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-grow">
                          {editingCommentId === comment.id ? (
                            <div className="mt-1 flex flex-col gap-1.5 w-full">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-1.5 text-xs bg-[#fafafa] text-[#262626] focus:border-gray-400 focus:outline-none resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  className="text-[#0095f6] hover:text-[#005f9e] font-semibold text-[11px] cursor-pointer"
                                  onClick={async () => {
                                    if (!editingCommentText.trim()) return;
                                    try {
                                      await updateComment(comment.id, CURRENT_USER_ID, editingCommentText);
                                      setEditingCommentId(null);
                                      await loadComments();
                                    } catch (err) {
                                      alert(getErrorMessage(err, "Failed to update comment"));
                                    }
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="text-gray-500 hover:text-gray-700 font-medium text-[11px] cursor-pointer"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-[#262626] leading-tight">
                                <span className="font-semibold mr-1.5">{comment.username}</span>
                                <span className="break-words text-gray-800">{comment.text}</span>
                              </p>
                              <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400 font-semibold select-none">
                                <span>{formatTimeAgo(comment.createdAt || comment.updatedAt)}</span>
                                <button type="button" className="hover:text-[#262626] font-semibold text-[11px]">
                                  Reply
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Professional 3 dots comments options (for owner) */}
                      {comment.userId === CURRENT_USER_ID && !editingCommentId && (
                        <button
                          type="button"
                          className="text-gray-400 hover:text-black font-bold text-sm px-1.5 py-0.5 leading-none transition-colors opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentMenuOpenId(comment);
                          }}
                        >
                          ⋯
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Lower Actions Section */}
              <div className="border-t border-gray-100 flex-shrink-0 bg-white">
                <div className="flex justify-between items-center p-3 pb-1 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className={`p-1 cursor-pointer transition-all duration-200 active:scale-75 ${
                        liked ? "text-[#ed4956]" : "text-[#262626] hover:text-gray-500"
                      }`}
                      onClick={handleLike}
                    >
                      <Heart className={`w-6 h-6 ${liked ? "fill-[#ed4956] stroke-[#ed4956]" : ""}`} />
                    </button>
                    <button type="button" className="p-1 text-[#262626] hover:text-[#8e8e8e]">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button type="button" className="p-1 text-[#262626] hover:text-[#8e8e8e]">
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <button type="button" className="p-1 text-[#262626] hover:text-[#8e8e8e]">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>

                <div className="px-4 py-2 bg-white">
                  <p className="text-[13px] font-semibold text-[#262626]">{likes} likes</p>
                </div>

                {/* Modal comment input form */}
                <div className="border-t border-gray-100 p-2.5 px-4 flex gap-3 items-center relative bg-white">
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      className="p-1 hover:opacity-70 transition-opacity"
                      onClick={() => setEmojiOpen(!emojiOpen)}
                    >
                      <Smile className="w-6 h-6 text-[#262626]" />
                    </button>

                    {emojiOpen && (
                      <div className="absolute bottom-[40px] left-0 z-50 shadow-2xl scale-90 origin-bottom-left">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>

                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleComment();
                    }}
                    placeholder="Add a comment..."
                    className="flex-grow border-none outline-none text-[13px] bg-transparent text-[#262626] h-9 focus:ring-0 placeholder-gray-400"
                  />

                  <button
                    type="button"
                    disabled={commentSubmitting || !commentText.trim()}
                    onClick={handleComment}
                    className="text-[#0095f6] font-semibold text-sm disabled:opacity-40 hover:text-[#005f9e] transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment 3-Dots Real-Time Instagram Style Options Modal */}
      {commentMenuOpenId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[20000] p-4 animate-fade-in" id="comment-options-backdrop">
          <div className="w-[320px] bg-white rounded-xl overflow-hidden text-center shadow-2xl animate-scale-up">
            <button
              type="button"
              className="block w-full py-4 text-sm text-[#ed4956] font-bold hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={async () => {
                const commentId = commentMenuOpenId.id;
                setCommentMenuOpenId(null);
                try {
                  await handleDeleteComment(commentId);
                } catch (error) {
                  alert(getErrorMessage(error, "Delete comment failed"));
                }
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm text-[#262626] font-semibold hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                setEditingCommentId(commentMenuOpenId.id);
                setEditingCommentText(commentMenuOpenId.text);
                setCommentMenuOpenId(null);
              }}
            >
              Edit Comment
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm text-gray-500 font-normal hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => setCommentMenuOpenId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {deleteCommentId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[20000] p-4" id="delete-comment-confirm-modal">
          <div className="w-[300px] bg-white rounded-xl overflow-hidden text-center shadow-2xl animate-scale-up">
            <h3 className="mt-5 mb-1.5 text-[16px] font-semibold text-[#262626]">Delete comment?</h3>
            <p className="text-gray-500 mx-5 mb-5 text-[13px] leading-relaxed">This action cannot be undone and the comment will be lost.</p>

            <button
              type="button"
              className="block w-full py-3.5 border-t border-gray-100 text-sm text-[#ed4956] font-bold hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={async () => {
                try {
                  await handleDeleteComment(deleteCommentId);
                } finally {
                  setDeleteCommentId(null);
                }
              }}
            >
              Delete
            </button>

            <button
              type="button"
              className="block w-full py-3.5 border-t border-gray-100 text-sm text-gray-600 hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={() => setDeleteCommentId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3-Dots Post Options Modal for Header / Comments Modal triggers */}
      {showPostOptions && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[210000] p-4 animate-fade-in"
          id={`post-options-modal-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowPostOptions(false);
          }}
        >
          <div 
            className="w-full max-w-[400px] bg-white rounded-xl overflow-hidden text-center shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full py-4 text-sm font-bold text-[#ed4956] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("This post has been reported to administrators.");
                setShowPostOptions(false);
              }}
            >
              Report
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("Redirecting to dedicated post url...");
                setShowPostOptions(false);
              }}
            >
              Go to post
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("Share dialog requested.");
                setShowPostOptions(false);
              }}
            >
              Share to...
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                const linkUrl = window.location.origin + `/posts/${post.id}`;
                navigator.clipboard.writeText(linkUrl);
                setPostOptionsToast(true);
                setShowPostOptions(false);
                setTimeout(() => setPostOptionsToast(false), 2000);
              }}
            >
              Copy link
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("Embed code copied!");
                setShowPostOptions(false);
              }}
            >
              Embed
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert(`Account Details:\nUsername: ${post.user?.username || post.username || "user"}\nJoined: June 2026`);
                setShowPostOptions(false);
              }}
            >
              About this account
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-normal text-gray-500 hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => setShowPostOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Copy link indicator toast background */}
      {postOptionsToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#2c2c2c] text-white text-xs font-semibold py-2.5 px-6 rounded-md z-[220000] shadow-xl pointer-events-none animate-fade-in border border-white/10 select-none">
          Link copied to clipboard!
        </div>
      )}
    </>
  );
}

export default PostCard;
