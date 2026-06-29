import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Send,
  X,
  MoreHorizontal,
  Volume2,
  VolumeX,
  CalendarDays,
  MapPin,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import {
  likeStory,
  unlikeStory,
  isStoryLiked,
  getStoryLikeCount,
  getStoryViewCount,
  getStoryViewers,
  getStoryLikesUsers,
  getStoryReplies,
  replyToStory,
  trackStoryView,
  saveStory,
  unsaveStory,
  deleteStory,
  archiveStory,
} from "../api/storiesApi";
import ShareModal from "./ShareModal";
import { createReport } from "../api/reportsApi";
import { getAvatarUrl } from "../utils/avatar";
import { useCurrentUser } from "../hooks/useCurrentUser";

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

const storyReportOptions = {
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

function StoryViewer({ user, stories = [], onClose }) {
  const navigate = useNavigate();
  const { currentUserId } = useCurrentUser();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const isOwnStory = String(currentUserId || "") === String(user?.id || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOwnerAnalytics, setShowOwnerAnalytics] = useState(false);
  const [analyticsList, setAnalyticsList] = useState(null);
  const [analyticsMode, setAnalyticsMode] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState("main");
  const [shareStory, setShareStory] = useState(null);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const videoRef = useRef(null);
  const musicRef = useRef(null);
  const pointerDownTimer = useRef(null);
  const wasHolding = useRef(false);

  const activeStory = stories[index];

  const goNext = () => {
    if (index < stories.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const goPrevious = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const formatTimeAgo = (dateValue) => {
    if (!dateValue) return "";
    const created = new Date(dateValue);
    const diffMs = Date.now() - created.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const formatJoinedDate = (dateValue) => {
    if (!dateValue) return "Unavailable";
    return new Date(dateValue).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const storyDuration = useMemo(() => {
    if (activeStory?.mediaType === "VIDEO" || isVideoUrl(activeStory?.mediaUrl)) {
      return 12000;
    }
    return 6000;
  }, [activeStory]);

  useEffect(() => {
    if (!activeStory) return;
    setProgress(0);
    setMenuOpen(false);
    setReportOpen(false);
    setReportStep("main");
    loadStoryData();
    trackStoryView(activeStory.id).catch(() => {});
  }, [activeStory?.id]);

  const goNextRef = useRef(null);
  useEffect(() => { goNextRef.current = goNext; }, [goNext]);

  useEffect(() => {
    if (!activeStory || paused || menuOpen || aboutOpen || reportOpen || shareStory || showOwnerAnalytics) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setTimeout(() => goNextRef.current?.(), 0);
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, paused, menuOpen, aboutOpen, reportOpen, shareStory, showOwnerAnalytics, storyDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused || menuOpen || aboutOpen || reportOpen || shareStory || showOwnerAnalytics) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused, menuOpen, aboutOpen, reportOpen, shareStory, index]);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (paused || menuOpen || aboutOpen || reportOpen || shareStory || showOwnerAnalytics) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [activeStory?.musicAudioUrl, muted, paused, menuOpen, aboutOpen, reportOpen, shareStory, showOwnerAnalytics, index]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (index > 0) setIndex((prev) => prev - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index < stories.length - 1) {
          setIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setPaused((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, stories.length, onClose]);

  const loadStoryData = async () => {
    if (!activeStory) return;

    try {
      const [likedStatus, count, views, replies] = await Promise.all([
        currentUserId ? isStoryLiked(activeStory.id, currentUserId) : false,
        getStoryLikeCount(activeStory.id),
        getStoryViewCount(activeStory.id).catch(() => activeStory.viewCount ?? 0),
        getStoryReplies(activeStory.id).catch(() => []),
      ]);

      setLiked(Boolean(likedStatus));
      setLikeCount(count || 0);
      setViewCount(Math.max(Number(views || 0) - (isOwnStory ? 1 : 0), 0));
      setReplyCount(Array.isArray(replies) ? replies.length : activeStory.replyCount ?? 0);
    } catch {
      setLiked(false);
      setLikeCount(0);
      setViewCount(Math.max(Number(activeStory.viewCount || 0) - (isOwnStory ? 1 : 0), 0));
      setReplyCount(activeStory.replyCount ?? 0);
    }
  };

  const handleLike = async () => {
    if (!currentUserId || !activeStory) return;

    try {
      if (liked) {
        await unlikeStory(activeStory.id, currentUserId);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      } else {
        await likeStory(activeStory.id, currentUserId);
        setLikeCount((prev) => prev + 1);
      }
      setLiked((prev) => !prev);
    } catch {  }
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || !activeStory) return;

    if (!currentUserId) return;

    try {
      await replyToStory(activeStory.id, currentUserId, text);
      setReplyText("");
      setReplyCount((prev) => prev + 1);
      setToast("Reply sent");
      setTimeout(() => setToast(""), 2000);
    } catch {  }
  };

  const handleSaveToggle = async () => {
    if (!activeStory) return;

    try {
      if (saved) {
        await unsaveStory(activeStory.id);
        setSaved(false);
        setToast("Removed from saved");
      } else {
        await saveStory(activeStory.id);
        setSaved(true);
        setToast("Story saved");
      }
      setMenuOpen(false);
      setPaused(false);
      setTimeout(() => setToast(""), 2000);
    } catch {  }
  };

  const handleDelete = async () => {
    if (!activeStory) return;
    try {
      await deleteStory(activeStory.id);
      setMenuOpen(false);
      setToast("Story deleted");
      setTimeout(onClose, 300);
    } catch {
      setMenuOpen(false);
      setPaused(false);
      setToast("Could not delete story");
      setTimeout(() => setToast(""), 2000);
    }
  };

  const handleArchive = async () => {
    if (!activeStory) return;
    try {
      await archiveStory(activeStory.id);
      setToast("Story archived");
    } catch {
      setToast("Could not archive story");
    }
    setMenuOpen(false);
    setTimeout(onClose, 500);
  };

  const closeReportModal = () => {
    setReportOpen(false);
    setReportStep("main");
    setPaused(false);
  };

  const handleReportOption = async (option) => {
    if (option.next === "success" && activeStory) {
      try {
        await createReport({
          targetType: "STORY",
          targetId: activeStory.id,
          reason: option.label || "GENERAL",
          description: "",
        });
      } catch {}
    }
    setReportStep(option.next);
  };

  const isVideo =
    activeStory?.mediaType === "VIDEO" || isVideoUrl(activeStory?.mediaUrl);

  const handlePointerDown = () => {
    wasHolding.current = false;
    pointerDownTimer.current = setTimeout(() => {
      wasHolding.current = true;
      setPaused(true);
    }, 200);
  };

  const handlePointerUp = () => {
    clearTimeout(pointerDownTimer.current);
    if (wasHolding.current) {
      setPaused(false);
    }
  };

  const handleContainerClick = (e) => {
    if (wasHolding.current) {
      wasHolding.current = false;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      goPrevious();
    } else if (x > 2 * third) {
      goNext();
    }
  };

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 z-[850] bg-[#1a1a1a] text-white">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-5 z-20 text-white"
      >
        <X className="h-8 w-8" />
      </button>

      <div className="flex h-full items-center justify-center">
        <div className="relative h-[90vh] w-[430px] max-w-[calc(100vw-24px)] overflow-hidden rounded-md bg-black shadow-2xl">
          <div className="absolute left-3 right-3 top-3 z-30 flex gap-1">
            {stories.map((story, storyIndex) => (
              <div
                key={story.id}
                className="h-[2px] flex-1 overflow-hidden rounded-full bg-card/30"
              >
                <div
                  className="h-full bg-card"
                  style={{
                    width:
                      storyIndex < index
                        ? "100%"
                        : storyIndex === index
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute left-3 right-3 top-7 z-30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigate(`/profile/${user?.id}`)} className="shrink-0">
                <img
                  src={getAvatarUrl(user)}
                  alt={user?.username}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span>{user?.username || "user"}</span>
                  <span className="font-normal text-white/70">
                    {formatTimeAgo(activeStory.createdAt)}
                  </span>
                </div>

                {activeStory.postId && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/post/${activeStory.postId}`;
                    }}
                    className="text-[10px] font-semibold text-white/90"
                  >
                    Watch full post ›
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMuted((prev) => !prev)}>
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setMenuOpen(true);
                }}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleContainerClick}
            className="absolute inset-0 z-10 cursor-pointer"
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={activeStory.mediaUrl}
                muted={muted}
                autoPlay
                playsInline
                className="h-full w-full object-contain bg-black pointer-events-none"
              />
            ) : (
              <img
                src={activeStory.mediaUrl}
                alt="story"
                loading="lazy"
                className="h-full w-full object-contain bg-black pointer-events-none"
              />
            )}
          </div>

          {activeStory.musicAudioUrl && (
            <>
              <audio ref={musicRef} src={activeStory.musicAudioUrl} loop className="hidden" />
              <div className="absolute left-5 right-5 bottom-36 z-30 flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 text-xs font-semibold">
                <Volume2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {activeStory.musicTitle}
                  {activeStory.musicArtist ? ` · ${activeStory.musicArtist}` : ""}
                </span>
              </div>
            </>
          )}

          {activeStory.caption && (
            <p className={`absolute ${activeStory.musicAudioUrl ? "bottom-36" : "bottom-24"} left-5 right-5 z-30 whitespace-pre-wrap rounded-lg bg-black/30 px-3 py-2 text-sm`}>
              {activeStory.caption}
            </p>
          )}

          {!isOwnStory && (
            <div className="absolute bottom-4 left-3 right-3 z-40 flex items-center gap-3">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder={`Reply to ${user?.username || "user"}...`}
                className="flex-1 rounded-full border border-white/70 bg-transparent px-4 py-2 text-xs text-white placeholder:text-white outline-none"
              />

              <button type="button" onClick={handleLike}>
                <Heart
                  className={`h-6 w-6 ${
                    liked ? "fill-white stroke-white" : "stroke-white"
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setShareStory(activeStory);
                }}
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
          )}

          {isOwnStory && (
            <div className="absolute bottom-20 left-3 right-3 z-40 flex items-center justify-around gap-2 rounded-lg bg-black/40 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setAnalyticsMode("views");
                  setAnalyticsLoading(true);
                  setShowOwnerAnalytics(true);
                  getStoryViewers(activeStory.id).then((viewers) => {
                    setAnalyticsList(viewers.map((v) => v.user || v));
                  }).catch(() => setAnalyticsList([])).finally(() => setAnalyticsLoading(false));
                }}
                className="flex flex-col items-center gap-0.5"
              >
              <span className="text-xs font-bold text-white">{viewCount}</span>
                <span className="text-[10px] text-white/80">Views</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setAnalyticsMode("likes");
                  setAnalyticsLoading(true);
                  setShowOwnerAnalytics(true);
                  getStoryLikesUsers(activeStory.id).then((users) => {
                    setAnalyticsList(users);
                  }).catch(() => setAnalyticsList([])).finally(() => setAnalyticsLoading(false));
                }}
                className="flex flex-col items-center gap-0.5"
              >
                <span className="text-xs font-bold text-white">{likeCount}</span>
                <span className="text-[10px] text-white/80">Likes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setAnalyticsMode("replies");
                  setAnalyticsLoading(true);
                  setShowOwnerAnalytics(true);
                  getStoryReplies(activeStory.id).then((replies) => {
                    setAnalyticsList(Array.isArray(replies) ? replies : []);
                  }).catch(() => setAnalyticsList([])).finally(() => setAnalyticsLoading(false));
                }}
                className="flex flex-col items-center gap-0.5"
              >
                <span className="text-xs font-bold text-white">{replyCount}</span>
                <span className="text-[10px] text-white/80">Replies</span>
              </button>
            </div>
          )}

          {!isOwnStory && likeCount > 0 && (
            <div className="absolute bottom-16 right-5 z-40 text-xs font-semibold">
              {likeCount} like{likeCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {showOwnerAnalytics && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-card">
            <div className="flex items-center justify-between border-b border-primary px-4 py-3">
              <button type="button" onClick={() => { setShowOwnerAnalytics(false); setAnalyticsList(null); setAnalyticsMode(null); }}>
                <X className="h-5 w-5 text-primary" />
              </button>
              <h3 className="text-sm font-semibold text-primary">
                {analyticsMode === "views" ? "Views" : analyticsMode === "likes" ? "Likes" : "Replies"}
              </h3>
              <div className="w-5" />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {analyticsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-secondary border-t-[#0095f6]" />
                </div>
              ) : analyticsList && analyticsList.length > 0 ? (
                analyticsList.map((item, idx) => {
                  const analyticsUser = analyticsMode === "replies" ? item?.user : item;
                  if (!analyticsUser) return null;
                  return (
                    <div key={analyticsUser.id ?? idx} className="flex items-center gap-3 px-4 py-3">
                      <button type="button" onClick={() => { setShowOwnerAnalytics(false); navigate(`/profile/${analyticsUser.id}`); }} className="shrink-0">
                        <img
                          src={analyticsUser.profilePicture || "/default-avatar.png"}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">{analyticsUser.username}</p>
                        {analyticsUser.fullName && (
                          <p className="truncate text-xs text-secondary">{analyticsUser.fullName}</p>
                        )}
                      </div>
                      {analyticsMode === "replies" && item?.text && (
                        <p className="max-w-[140px] truncate text-xs text-secondary">{item.text}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-secondary">No data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50">
          <div className="w-[420px] overflow-hidden rounded-2xl bg-card text-center text-sm text-primary">
            {isOwnStory ? (
              <>
                <button
                  type="button"
                  onClick={handleArchive}
                  className="block w-full border-b border-primary py-4 font-semibold"
                >
                  Archive
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="block w-full border-b border-primary py-4 font-semibold text-[#ed4956]"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPaused(false);
                  }}
                  className="block w-full py-4"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setAboutOpen(true);
                    setPaused(true);
                  }}
                  className="block w-full border-b border-primary py-4"
                >
                  About this account
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPaused(false);
                  }}
                  className="block w-full py-4"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-[930] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[448px] overflow-hidden rounded-2xl bg-card text-primary shadow-2xl">
            <div className="relative flex h-[52px] items-center justify-center border-b border-primary">
              {reportStep !== "main" && reportStep !== "success" && (
                <button
                  type="button"
                  onClick={() => setReportStep("main")}
                  className="absolute left-4 text-primary"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}

              {reportStep !== "success" && (
                <h2 className="text-sm font-bold">Report</h2>
              )}

              <button
                type="button"
                onClick={closeReportModal}
                className="absolute right-4 text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reportStep === "success" ? (
              <div>
                <div className="px-6 pb-8 pt-7 text-center">
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-green-500 text-green-500">
                    ✓
                  </div>

                  <h3 className="text-sm font-bold">
                    Thanks for reporting this post
                  </h3>

                  <p className="mt-3 text-xs leading-5 text-secondary">
                    You'll get a notification once we review your report. Thanks
                    for helping us keep Instagram a safe and supportive community.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setToast(`Blocked ${user?.username || "this account"}`);
                    setTimeout(() => setToast(""), 2000);
                    closeReportModal();
                  }}
                  className="flex w-full items-center justify-between border-t border-secondary px-5 py-4 text-left text-sm text-[#ed4956] hover:bg-secondary"
                >
                  <span>Block {user?.username || "this account"}</span>
                  <ChevronRight className="h-4 w-4 text-secondary" />
                </button>

                <div className="border-t border-secondary p-3">
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
                <div className="border-b border-secondary px-4 py-4">
                  <h3 className="text-sm font-bold">
                    {storyReportOptions[reportStep]?.title}
                  </h3>
                </div>

                <div className="py-1">
                  {(storyReportOptions[reportStep]?.options || []).map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleReportOption(option)}
                      className="flex w-full items-center justify-between border-b border-secondary px-4 py-4 text-left text-xs hover:bg-secondary"
                    >
                      <span>{option.label}</span>
                      <ChevronRight className="h-4 w-4 text-secondary" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="fixed inset-0 z-[920] flex items-center justify-center bg-black/50">
          <div className="w-[420px] overflow-hidden rounded-2xl bg-card text-primary">
            <div className="border-b border-primary py-4 text-center text-sm font-bold">
              About this account
            </div>

            <div className="px-6 py-5 text-center">
              <img
                src={getAvatarUrl(user)}
                alt={user?.username}
                className="mx-auto h-16 w-16 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />

              <h3 className="mt-3 text-sm font-bold">
                {user?.username || "user"}
              </h3>

              <p className="mt-3 text-[11px] leading-4 text-secondary">
                To help keep our community authentic, we're showing information
                about profiles on Instagram.
              </p>

              <div className="mt-6 space-y-5 text-left">
                <div className="flex gap-4">
                  <CalendarDays className="h-5 w-5" />
                  <div>
                    <p className="text-sm">Account Created:</p>
                    <p className="text-xs text-secondary">
                      {formatJoinedDate(user?.createdAt)}
                    </p>
                  </div>
                </div>

                {user?.accountBasedIn && (
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <p className="text-sm">Account based in</p>
                      <p className="text-xs text-secondary">
                        {user.accountBasedIn}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAboutOpen(false);
                setPaused(false);
              }}
              className="block w-full border-t border-primary py-4 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-[950] -translate-x-1/2 rounded-md bg-card px-4 py-2 text-xs font-semibold text-primary">
          {toast}
        </div>
      )}

      {shareStory && (
        <ShareModal
          post={shareStory}
          currentUserId={currentUserId}
          onClose={() => {
            setShareStory(null);
            setPaused(false);
          }}
        />
      )}
    </div>
  );
}

export default StoryViewer;
