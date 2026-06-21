import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Send,
  X,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Pause,
  Play,
  CalendarDays,
  MapPin,
  UserRound,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import {
  likeStory,
  unlikeStory,
  isStoryLiked,
  getStoryLikeCount,
  replyToStory,
} from "../api/storiesApi";
import ShareModal from "./ShareModal";
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
  const { currentUserId } = useCurrentUser();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState("main");
  const [shareStory, setShareStory] = useState(null);
  const [toast, setToast] = useState("");
  const videoRef = useRef(null);

  const activeStory = stories[index];

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
  }, [activeStory?.id]);

  useEffect(() => {
    if (!activeStory || paused || menuOpen || aboutOpen || reportOpen || shareStory) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, paused, menuOpen, aboutOpen, reportOpen, shareStory, storyDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused || menuOpen || aboutOpen || reportOpen || shareStory) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused, menuOpen, aboutOpen, reportOpen, shareStory, index]);

  const loadStoryData = async () => {
    if (!activeStory) return;

    try {
      const [likedStatus, count] = await Promise.all([
        currentUserId ? isStoryLiked(activeStory.id, currentUserId) : false,
        getStoryLikeCount(activeStory.id),
      ]);

      setLiked(Boolean(likedStatus));
      setLikeCount(count || 0);
    } catch {
      setLiked(false);
      setLikeCount(0);
    }
  };

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

  const handleLike = async () => {
    if (!currentUserId || !activeStory) {
      alert("Please login first");
      return;
    }

    try {
      if (liked) {
        await unlikeStory(activeStory.id, currentUserId);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      } else {
        await likeStory(activeStory.id, currentUserId);
        setLikeCount((prev) => prev + 1);
      }
      setLiked((prev) => !prev);
    } catch {
      alert("Story like failed");
    }
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || !activeStory) return;

    if (!currentUserId) {
      alert("Please login first");
      return;
    }

    try {
      await replyToStory(activeStory.id, currentUserId, text);
      setReplyText("");
      setToast("Reply sent");
      setTimeout(() => setToast(""), 2000);
    } catch {
      alert("Reply failed");
    }
  };

  const closeReportModal = () => {
    setReportOpen(false);
    setReportStep("main");
    setPaused(false);
  };

  const handleReportOption = (option) => {
    setReportStep(option.next);
  };

  const isVideo =
    activeStory?.mediaType === "VIDEO" || isVideoUrl(activeStory?.mediaUrl);

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 z-[850] bg-[#1a1a1a] text-white">
      <div className="absolute left-5 top-5 z-20 font-['Grand_Hotel'] text-[28px]">
        Instagram
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-5 z-20 text-white"
      >
        <X className="h-8 w-8" />
      </button>

      <div className="flex h-full items-center justify-center">
        <div className="relative h-[94vh] max-h-[860px] w-[430px] overflow-hidden rounded-md bg-black shadow-2xl">
          <div className="absolute left-3 right-3 top-3 z-30 flex gap-1">
            {stories.map((story, storyIndex) => (
              <div
                key={story.id}
                className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <div
                  className="h-full bg-white"
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
              <img
                src={getAvatarUrl(user)}
                alt={user?.username}
                className="h-8 w-8 rounded-full object-cover"
              />
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

              <button type="button" onClick={() => setPaused((prev) => !prev)}>
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
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

          <button
            type="button"
            onClick={goPrevious}
            className="absolute left-0 top-0 z-20 h-full w-1/2"
            aria-label="Previous story"
          />

          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-0 z-20 h-full w-1/2"
            aria-label="Next story"
          />

          {isVideo ? (
            <video
              ref={videoRef}
              src={activeStory.mediaUrl}
              muted={muted}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt="story"
              className="h-full w-full object-cover"
            />
          )}

          {activeStory.caption && (
            <p className="absolute bottom-24 left-5 right-5 z-30 whitespace-pre-wrap rounded-lg bg-black/30 px-3 py-2 text-sm">
              {activeStory.caption}
            </p>
          )}

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

          {likeCount > 0 && (
            <div className="absolute bottom-16 right-5 z-40 text-xs font-semibold">
              {likeCount} like{likeCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50">
          <div className="w-[420px] overflow-hidden rounded-2xl bg-white text-center text-sm text-[#262626]">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setReportStep("main");
                setReportOpen(true);
                setPaused(true);
              }}
              className="block w-full border-b border-gray-200 py-4 font-semibold text-[#ed4956]"
            >
              Report inappropriate
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAboutOpen(true);
                setPaused(true);
              }}
              className="block w-full border-b border-gray-200 py-4"
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
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-[930] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-[448px] overflow-hidden rounded-2xl bg-white text-[#262626] shadow-2xl">
            <div className="relative flex h-[52px] items-center justify-center border-b border-gray-200">
              {reportStep !== "main" && reportStep !== "success" && (
                <button
                  type="button"
                  onClick={() => setReportStep("main")}
                  className="absolute left-4 text-[#262626]"
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
                className="absolute right-4 text-[#262626]"
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

                  <p className="mt-3 text-xs leading-5 text-gray-500">
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
                  className="flex w-full items-center justify-between border-t border-gray-100 px-5 py-4 text-left text-sm text-[#ed4956] hover:bg-gray-50"
                >
                  <span>Block {user?.username || "this account"}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToast("Community Standards opened");
                    setTimeout(() => setToast(""), 2000);
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
                      className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-4 text-left text-xs hover:bg-gray-50"
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

      {aboutOpen && (
        <div className="fixed inset-0 z-[920] flex items-center justify-center bg-black/50">
          <div className="w-[420px] overflow-hidden rounded-2xl bg-white text-[#262626]">
            <div className="border-b border-gray-200 py-4 text-center text-sm font-bold">
              About this account
            </div>

            <div className="px-6 py-5 text-center">
              <img
                src={getAvatarUrl(user)}
                alt={user?.username}
                className="mx-auto h-16 w-16 rounded-full object-cover"
              />

              <h3 className="mt-3 text-sm font-bold">
                {user?.username || "user"}
              </h3>

              <p className="mt-3 text-[11px] leading-4 text-gray-500">
                To help keep our community authentic, we're showing information
                about profiles on Instagram.
              </p>

              <div className="mt-6 space-y-5 text-left">
                <div className="flex gap-4">
                  <CalendarDays className="h-5 w-5" />
                  <div>
                    <p className="text-sm">Date joined</p>
                    <p className="text-xs text-gray-500">
                      {formatJoinedDate(user?.createdAt)}
                    </p>
                  </div>
                </div>

                {user?.accountBasedIn && (
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <p className="text-sm">Account based in</p>
                      <p className="text-xs text-gray-500">
                        {user.accountBasedIn}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <UserRound className="h-5 w-5" />
                  <p className="flex-1 text-sm">Former usernames</p>
                  <span className="text-xs text-gray-500">
                    {user?.formerUsernamesCount ?? "Unavailable"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAboutOpen(false);
                setPaused(false);
              }}
              className="block w-full border-t border-gray-200 py-4 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-[950] -translate-x-1/2 rounded-md bg-white px-4 py-2 text-xs font-semibold text-[#262626]">
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