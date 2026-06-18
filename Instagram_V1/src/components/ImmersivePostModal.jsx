import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Send, Bookmark, X, ChevronUp, ChevronDown, Smile, MoreHorizontal, MessageSquare, Volume2, VolumeX } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { likePost, unlikePost } from "../api/likesApi";
import { getComments, addComment, deleteComment } from "../api/commentsApi";

function ImmersivePostModal({ post, postsList = [], onClose, onRefresh, onSelectPost }) {
  const activeUser = JSON.parse(
    localStorage.getItem("currentUser") ||
      '{"id":1,"username":"lavanya","fullName":"Lavanya","profilePicture":"https://i.pravatar.cc/100?img=5"}'
  );
  const CURRENT_USER_ID = activeUser?.id || 1;

  const [liked, setLiked] = useState(post?.likedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(post?.likeCount || 0);
  const [commentsList, setCommentsList] = useState([]);
  const [isFollowing, setIsFollowing] = useState(() => {
    const follows = JSON.parse(localStorage.getItem("followed_users") || "[]");
    return follows.includes(post?.user?.id || post?.userId);
  });
  const [bookmarked, setBookmarked] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [copyToast, setCopyToast] = useState(false);
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  
  // Controls side comments panel for immersive view
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const commentsContainerRef = useRef(null);

  // Load comments
  const loadComments = async () => {
    if (!post?.id) return;
    try {
      const data = await getComments(post.id);
      setCommentsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (post) {
      setLiked(post.likedByCurrentUser || false);
      setLikesCount(post.likeCount || 0);
      loadComments();
      setIsFollowing(() => {
        const follows = JSON.parse(localStorage.getItem("followed_users") || "[]");
        return follows.includes(post.user?.id || post.userId);
      });
      // Reset comments drawer State to closed or open by default
      setCommentsDrawerOpen(false);
    }
  }, [post]);

  const handleLikeToggle = async () => {
    if (!post?.id) return;
    try {
      if (liked) {
        await unlikePost(post.id, CURRENT_USER_ID);
        setLikesCount(prev => Math.max(prev - 1, 0));
        setLiked(false);
      } else {
        await likePost(post.id, CURRENT_USER_ID);
        setLikesCount(prev => prev + 1);
        setLiked(true);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = () => {
    const targetUserId = post?.user?.id || post?.userId || 1;
    let follows = JSON.parse(localStorage.getItem("followed_users") || "[]");
    if (isFollowing) {
      follows = follows.filter(id => id !== targetUserId);
      setIsFollowing(false);
    } else {
      follows.push(targetUserId);
      setIsFollowing(true);
    }
    localStorage.setItem("followed_users", JSON.stringify(follows));
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !post?.id) return;
    try {
      await addComment(post.id, CURRENT_USER_ID, newCommentText);
      setNewCommentText("");
      setEmojiOpen(false);
      await loadComments();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/posts/${post?.id || ""}`);
    setCopyToast(true);
    setShowOptionsPopup(false);
    setTimeout(() => setCopyToast(false), 2000);
  };

  // Helper function to format date/time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Find index of current post in standard posts list to navigate
  const currentIndex = postsList.findIndex(p => p.id === post?.id);

  const handlePrevPost = () => {
    if (currentIndex > 0 && onSelectPost) {
      onSelectPost(postsList[currentIndex - 1]);
    }
  };

  const handleNextPost = () => {
    if (currentIndex !== -1 && currentIndex < postsList.length - 1 && onSelectPost) {
      onSelectPost(postsList[currentIndex + 1]);
    }
  };

  if (!post) return null;

  const username = post.user?.username || post.username || "instagram_user";
  const userPic = post.user?.profilePicture || "https://i.pravatar.cc/100?img=1";

  return (
    <div 
      className="fixed inset-0 bg-[#0c0c0c] z-[60000] flex items-center justify-center font-sans text-white select-none overflow-hidden animate-fade-in" 
      id="immersive-modal-backdrop" 
      onClick={onClose}
    >
      {/* Viewport Close Button - Upper Right Corner */}
      <button
        onClick={onClose}
        className="fixed top-5 right-5 p-2 rounded-full hover:bg-white/10 transition-all text-white cursor-pointer z-[70000] filter drop-shadow hover:scale-105 active:scale-95"
        id="immersive-outer-close-btn"
        title="Close Immersive View"
      >
        <X className="w-8 h-8 text-white stroke-[2]" />
      </button>

      {/* Main Reels Framework - Responsive and scalable centered viewport box */}
      <div 
        className="relative flex items-center justify-center w-full h-[100dvh] max-h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left/Center Viewport Column: Clean aspect-ratio container mirroring real-life reel styling */}
        <div 
          className="relative h-[93vh] max-h-[880px] aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-300 border border-white/5 flex items-center justify-center"
          style={{ marginRight: commentsDrawerOpen ? "440px" : "0" }}
          id="immersive-media-stage"
        >
          {/* Main Media Showcase */}
          {post.media && post.media.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center relative">
              {post.media[0]?.mediaType === "VIDEO" ? (
                <video 
                  src={post.media[0].mediaUrl} 
                  controls 
                  autoPlay 
                  loop 
                  muted={isMuted}
                  className="w-full h-full object-cover" 
                  playsInline 
                />
              ) : (
                <img 
                  src={post.media[0].mediaUrl} 
                  alt="reel media item" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-[#121212] flex items-center justify-center text-white/40 text-xs">
              No media available
            </div>
          )}

          {/* Audio volume toggler overlay for videos */}
          {post.media?.[0]?.mediaType === "VIDEO" && (
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-all text-white cursor-pointer z-40"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}

          {/* Floating Creator details & description at bottom-left corner of the video frame */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-left z-35 flex flex-col justify-end select-text">
            {/* Creator Profile Line */}
            <div className="flex items-center gap-3.5 mb-2.5">
              <img 
                src={userPic} 
                alt="creator avatar" 
                className="w-8 h-8 rounded-full object-cover border border-white/40 p-[0.5px] shrink-0" 
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-[13.5px] font-semibold text-white whitespace-nowrap tracking-wide">
                    {username}
                  </span>
                  <span className="text-white/50 text-[10px] select-none">•</span>
                  <button
                    onClick={handleFollowToggle}
                    className={`font-semibold text-xs transition-colors cursor-pointer tracking-wide ${isFollowing ? "text-white/60 hover:text-white" : "text-[#0095f6] hover:text-[#3897f0]"}`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
                {/* Location subtitle if set, otherwise full name */}
                <span className="text-[10px] text-white/70 font-normal leading-none mt-1 whitespace-nowrap">
                  {post.location || post.user?.fullName || "Aditya University"}
                </span>
              </div>
            </div>

            {/* Post Caption Body with hashtag highlighting */}
            <p className="text-[13px] text-white/95 leading-relaxed font-normal whitespace-pre-line max-h-[120px] overflow-y-auto scrollbar-none break-all pr-2">
              {post.caption || "No description provided."}
            </p>

            {/* Static Simulated audio overlay statement */}
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-white/70 font-semibold select-none bg-white/10 py-1 px-2.5 rounded-full w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Original audio</span>
            </div>
          </div>

          {/* FLOATING ACTION SIDE DOCK: Overlaying the bottom-right corner of the video frame */}
          <div className="absolute right-3.5 bottom-6 flex flex-col items-center gap-5 z-40 select-none">
            {/* Like Action */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleLikeToggle}
                className={`w-[45px] h-[45px] rounded-full bg-black/35 hover:bg-black/50 transition-all flex items-center justify-center text-white cursor-pointer active:scale-75 ${
                  liked ? "text-red-500" : "text-white"
                }`}
                title="Like reel"
              >
                <Heart className={`w-[26px] h-[26px] ${liked ? "fill-red-500 text-red-500" : "stroke-white"}`} />
              </button>
              <span className="text-[11.5px] font-bold text-white mt-1 filter drop-shadow-md">
                {likesCount}
              </span>
            </div>

            {/* Comments Toggle Action */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setCommentsDrawerOpen(prev => !prev)}
                className={`w-[45px] h-[45px] rounded-full transition-all flex items-center justify-center text-white cursor-pointer active:scale-75 ${
                  commentsDrawerOpen ? "bg-[#0095f6]" : "bg-black/35 hover:bg-black/50"
                }`}
                title="Toggle comments"
              >
                <MessageCircle className="w-[26px] h-[26px]" />
              </button>
              <span className="text-[11.5px] font-bold text-white mt-1 filter drop-shadow-md">
                {commentsList.length}
              </span>
            </div>

            {/* Direct Send/Share Action */}
            <div>
              <button
                onClick={handleCopyLink}
                className="w-[45px] h-[45px] rounded-full bg-black/35 hover:bg-black/50 transition-all flex items-center justify-center text-white cursor-pointer active:scale-75"
                title="Copy post link"
              >
                <Send className="w-[24px] h-[24px]" />
              </button>
              <span className="text-[10px] font-bold text-white mt-0.5 filter drop-shadow-md block">Share</span>
            </div>

            {/* Bookmark Block */}
            <div>
              <button
                onClick={() => setBookmarked(prev => !prev)}
                className="w-[45px] h-[45px] rounded-full bg-black/35 hover:bg-black/50 transition-all flex items-center justify-center text-white cursor-pointer active:scale-75"
                title="Save post"
              >
                <Bookmark className={`w-[24px] h-[24px] ${bookmarked ? "fill-white text-white" : "stroke-white"}`} />
              </button>
              <span className="text-[10px] font-bold text-white mt-0.5 filter drop-shadow-md block">Save</span>
            </div>

            {/* More Options Menu Triggers */}
            <div>
              <button
                onClick={() => setShowOptionsPopup(true)}
                className="w-[45px] h-[45px] rounded-full bg-black/35 hover:bg-black/50 transition-all flex items-center justify-center text-white cursor-pointer active:scale-75"
                title="Post options"
                type="button"
              >
                <MoreHorizontal className="w-[24px] h-[24px]" />
              </button>
              <span className="text-[10px] font-bold text-white mt-0.5 filter drop-shadow-md block">More</span>
            </div>

            {/* Creator Profile Shortcut */}
            <div className="mt-1">
              <img 
                src={userPic} 
                alt="creator short" 
                className="w-[32px] h-[32px] rounded-md object-cover border border-white/60 shadow-lg p-[0.5px]" 
              />
            </div>
          </div>
        </div>

        {/* Sliding Comments Drawer panel layout (matches Instagram detail look-and-feel inside dark UI context) */}
        {commentsDrawerOpen && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-[#121212] border-l border-white/10 flex flex-col z-[45] animate-slide-left text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header Area */}
            <div className="h-[62px] px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-15px font-bold tracking-wide">Comments</span>
                <span className="bg-white/10 text-white/85 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {commentsList.length}
                </span>
              </div>
              <button
                onClick={() => setCommentsDrawerOpen(false)}
                className="p-1 px-1.5 hover:bg-white/10 rounded transition-colors text-white cursor-pointer focus:outline-none"
                title="Close comments panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List Container */}
            <div 
              ref={commentsContainerRef}
              className="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-4 text-left scrollbar-thin scrollbar-thumb-white/10"
            >
              {commentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-36 text-center select-none">
                  <MessageSquare className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-[15px] font-bold text-white/90 mb-1">No comments yet</p>
                  <p className="text-white/40 text-xs font-normal">Start the conversation by posting a note.</p>
                </div>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 justify-between group text-[13px] leading-snug">
                    <div className="flex items-start gap-2.5 flex-grow min-w-0">
                      <img 
                        src={c.profilePicture || "https://i.pravatar.cc/100?img=15"} 
                        alt="commenter" 
                        className="w-7.5 h-7.5 rounded-full object-cover border border-white/10 shrink-0 mt-0.5" 
                      />
                      <div className="min-w-0 flex-grow">
                        <p className="text-white leading-tight text-[13px]">
                          <span className="font-bold mr-1.5 text-white/95">{c.username}</span>
                          <span className="break-words text-white/80">{c.text}</span>
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/40 font-bold select-none">
                          <span>{formatTimeAgo(c.createdAt)}</span>
                          <button type="button" className="hover:text-white font-semibold cursor-pointer">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Comments Option (Authorized) */}
                    {c.userId === CURRENT_USER_ID && (
                      <button
                        type="button"
                        className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[11px] cursor-pointer font-semibold shrink-0"
                        onClick={async () => {
                          if (confirm("Delete this comment?")) {
                            try {
                              await deleteComment(c.id);
                              loadComments();
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Side-Drawer Comments Footer Input bar */}
            <div className="p-3 border-t border-white/10 flex gap-2 items-center flex-shrink-0 bg-[#121212] relative">
              <button
                onClick={() => setEmojiOpen(!emojiOpen)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer p-1.5 focus:outline-none"
                title="Add Emoji"
              >
                <Smile className="w-[22px] h-[22px]" />
              </button>

              {emojiOpen && (
                <div className="absolute bottom-[54px] left-3 z-[60000] shadow-2xl border border-white/5 rounded-lg bg-black">
                  <EmojiPicker
                    onEmojiClick={(emojiObj) => {
                      setNewCommentText(prev => prev + emojiObj.emoji);
                    }}
                    width={320}
                    height={380}
                    theme="dark"
                  />
                </div>
              )}

              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePostComment();
                }}
                placeholder="Add a comment..."
                className="flex-grow px-2 py-1 text-xs placeholder-white/30 outline-none border-none text-white bg-transparent"
              />

              <button
                onClick={handlePostComment}
                disabled={!newCommentText.trim()}
                className="text-[#0095f6] hover:text-[#3897f0] disabled:opacity-30 text-xs font-bold px-2 cursor-pointer transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STACKED CIRCULAR NAVIGATION CHEVRONS: Placed on the right margin of the page */}
      <div 
        className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-50 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handlePrevPost}
          disabled={currentIndex <= 0}
          className="w-11 h-11 rounded-full bg-[#1c1c1ecc] hover:bg-black/95 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Previous reel post"
          title="Previous post"
        >
          <ChevronUp className="w-5 h-5 font-bold stroke-[2.5]" />
        </button>

        <button
          onClick={handleNextPost}
          disabled={currentIndex === -1 || currentIndex >= postsList.length - 1}
          className="w-11 h-11 rounded-full bg-[#1c1c1ecc] hover:bg-black/95 border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Next reel post"
          title="Next post"
        >
          <ChevronDown className="w-5 h-5 font-bold stroke-[2.5]" />
        </button>
      </div>

      {/* Options Dropdown Overlay Modal (Image 3 layout style) */}
      {showOptionsPopup && (
        <div 
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[210000] p-4 animate-fade-in"
          id="post-options-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setShowOptionsPopup(false);
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
                setShowOptionsPopup(false);
              }}
            >
              Report
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("Redirecting to dedicated post url...");
                setShowOptionsPopup(false);
              }}
            >
              Go to post
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("Share dialog requested.");
                setShowOptionsPopup(false);
              }}
            >
              Share to...
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={handleCopyLink}
            >
              Copy link
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert("Embed code copied!");
                setShowOptionsPopup(false);
              }}
            >
              Embed
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-semibold text-[#262626] hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => {
                alert(`Account Details:\nUsername: ${username}\nJoined: June 2026`);
                setShowOptionsPopup(false);
              }}
            >
              About this account
            </button>
            <button
              type="button"
              className="block w-full py-4 border-t border-gray-100 text-sm font-normal text-gray-500 hover:bg-gray-50 border-none transition-colors cursor-pointer"
              onClick={() => setShowOptionsPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Copy Link Toast Alert */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#262626] shadow-xl text-white text-xs font-semibold py-2.5 px-6 rounded-md z-[220000] pointer-events-none animate-fade-in flex items-center justify-center border border-white/20 select-none">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default ImmersivePostModal;
