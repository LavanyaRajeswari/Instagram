import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getNotifications, markNotificationSeen, markAllNotificationsSeen } from "../api/notificationsApi";
import { followUser, unfollowUser, isFollowingUser } from "../api/followApi";
import { acceptFollowRequest, rejectFollowRequest } from "../api/followRequestsApi";
import { getAvatarUrl } from "../utils/avatar";
import { subscribeToNotifications, connect } from "../hooks/useWebSocket";

function getRelativeTime(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return new Date(dateStr).toLocaleDateString();
}

function notificationText(item) {
  const actor = item.actorUsername || "Someone";
  const type = String(item.type || "").toUpperCase();
  if (type.includes("LIKE")) return `${actor} liked your post.`;
  if (type.includes("COMMENT"))
    return `${actor} commented: ${item.commentText || ""}`;
  if (type === "FOLLOW_REQUEST") return `${actor} requested to follow you.`;
  if (type.includes("FOLLOW")) return `${actor} started following you.`;
  if (type.includes("GROUP")) return item.commentText || `${actor} added you to a group.`;
  if (type.includes("MENTION")) return `${actor} mentioned you.`;
  if (type.includes("TAG")) return `${actor} tagged you in a post.`;
  return `${actor} sent you a notification.`;
}

function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  const shouldInclude = (item) => {
    const type = String(item.type || "").toUpperCase();
    return !type.includes("MESSAGE") && !type.includes("CALL");
  };

  useEffect(() => {
    let cancelled = false;

    getNotifications()
      .then((data) => {
        const filtered = Array.isArray(data) ? data.filter(shouldInclude) : [];
        const sorted = [...filtered].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        if (!cancelled) setItems(sorted);

        const followIds = sorted
          .filter((item) => String(item.type || "").toUpperCase() === "FOLLOW")
          .map((item) => item.actorId)
          .filter(Boolean);

        if (followIds.length > 0) {
          Promise.allSettled(
            followIds.map((id) => isFollowingUser(id).then((status) => ({ id, status })))
          ).then((results) => {
            if (cancelled) return;
            const map = {};
            results.forEach((r) => {
              if (r.status === "fulfilled") map[r.value.id] = r.value.status;
            });
            setFollowingMap((prev) => ({ ...prev, ...map }));
          });
        }

        setTimeout(() => {
          if (!cancelled) {
            markAllNotificationsSeen().then(() => {
              window.dispatchEvent(new CustomEvent("notifications-seen"));
            });
          }
        }, 2000);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsub = subscribeToNotifications((notification) => {
      if (!cancelled && shouldInclude(notification)) {
        setItems((prev) => {
          const exists = prev.some((n) => n.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev];
        });
        window.dispatchEvent(new CustomEvent("notification-new"));
        if (String(notification.type || "").toUpperCase() === "FOLLOW") {
          isFollowingUser(notification.actorId)
            .then((status) => {
              if (!cancelled) setFollowingMap((prev) => ({ ...prev, [notification.actorId]: status }));
            })
            .catch(() => {});
        }
      }
    });

    connect();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const handleFollowToggle = useCallback(
    async (e, item) => {
      e.stopPropagation();
      const isFollowing = followingMap[item.actorId];
      setFollowingMap((prev) => ({ ...prev, [item.actorId]: !isFollowing }));
      try {
        if (isFollowing) {
          await unfollowUser(item.actorId);
        } else {
          await followUser(item.actorId);
        }
      } catch {
        setFollowingMap((prev) => ({
          ...prev,
          [item.actorId]: isFollowing,
        }));
      }
    },
    [followingMap]
  );

  const handleFollowRequestAction = useCallback(async (e, item, action) => {
    e.stopPropagation();
    if (!item.followRequestId) return;

    try {
      if (action === "accept") {
        await acceptFollowRequest(item.followRequestId);
      } else {
        await rejectFollowRequest(item.followRequestId);
      }

      setItems((prev) => prev.filter((notification) => notification.id !== item.id));
      window.dispatchEvent(new CustomEvent("notification-new"));
    } catch {
    }
  }, []);

  const handleNotificationClick = (item) => {
    if (!item.seen) {
      markNotificationSeen(item.id).then(() => {
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, seen: true } : n))
        );
        window.dispatchEvent(new CustomEvent("notifications-seen"));
      });
    }
    const type = String(item.type || "").toUpperCase();
    if (
      (type.includes("LIKE") ||
        type.includes("COMMENT") ||
        type.includes("MENTION")) &&
      item.postId
    ) {
      navigate(`/post/${item.postId}`);
    } else if (item.actorId) {
      navigate(`/profile/${item.actorId}`);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[700px] bg-card py-8">
      <div className="mb-6 px-4">
        <h1 className="text-2xl font-bold text-primary">Notifications</h1>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-secondary">
          Loading notifications...
        </p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-secondary">
          No notifications yet
        </p>
      ) : (
        <div>
          {items.map((item) => {
            const type = String(item.type || "").toUpperCase();
            const isFollowRequest = type === "FOLLOW_REQUEST" && item.followRequestId;
            const isFollowNotif = type === "FOLLOW";
            const isFollowing = followingMap[item.actorId];

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-secondary ${!item.seen ? "bg-[var(--bg-tertiary)]" : ""}`}
              >
                <img
                  src={getAvatarUrl({
                    profilePicture: item.actorProfilePicture,
                  })}
                  alt=""
                  className="h-11 w-11 shrink-0 cursor-pointer rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.actorId) navigate(`/profile/${item.actorId}`);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-tight text-primary ${!item.seen ? "font-semibold" : ""}`}>
                    <span
                      className="cursor-pointer font-bold hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.actorId)
                          navigate(`/profile/${item.actorId}`);
                      }}
                    >
                      {item.actorUsername || "Someone"}
                    </span>{" "}
                    {notificationText(item).replace(
                      `${item.actorUsername || "Someone"} `,
                      ""
                    )}
                  </p>
                  <span className={`mt-1 block text-xs ${!item.seen ? "text-[#0095f6] font-semibold" : "text-[#8e8e8e]"}`}>
                    {item.createdAt ? getRelativeTime(item.createdAt) : ""}
                  </span>
                </div>
                {!item.seen && (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0095f6]" />
                )}
                {isFollowRequest && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleFollowRequestAction(e, item, "accept")}
                      className="rounded-lg bg-[#0095f6] px-4 py-1.5 text-sm font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleFollowRequestAction(e, item, "decline")}
                      className="rounded-lg border border-primary bg-card px-4 py-1.5 text-sm font-semibold text-primary"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {isFollowNotif && (
                  <button
                    onClick={(e) => handleFollowToggle(e, item)}
                    className={`shrink-0 rounded-lg px-5 py-1.5 text-sm font-semibold ${
                      isFollowing
                        ? "border border-primary bg-card text-primary"
                        : "bg-[#0095f6] text-white"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow Back"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Notifications;
