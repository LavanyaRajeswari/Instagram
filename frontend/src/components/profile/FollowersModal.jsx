import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { followUser, getFollowers, getFollowing, isFollowingUser, unfollowUser } from "../../api/followApi";
import { getAvatarUrl } from "../../utils/avatar";

function FollowersModal({ user, type, currentUserId, onClose, onFollowChanged }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const title = type === "followers" ? "Followers" : "Following";

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = type === "followers" ? await getFollowers(user.id) : await getFollowing(user.id);
        if (!active) return;

        const list = Array.isArray(data) ? data : [];
        setUsers(list);

        const statusEntries = await Promise.all(
          list.map(async (item) => {
            const itemId = item.id ?? item.userId;
            if (!itemId || String(itemId) === String(currentUserId)) return [itemId, false];

            try {
              return [itemId, await isFollowingUser(itemId)];
            } catch {
              return [itemId, Boolean(item.following || item.followedByCurrentUser)];
            }
          })
        );

        if (active) {
          setFollowingMap(Object.fromEntries(statusEntries.filter(([id]) => id)));
        }
      } catch {  if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      active = false;
    };
  }, [currentUserId, type, user?.id]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((item) => {
      const username = item.username || "";
      const fullName = item.fullName || item.name || "";
      return `${username} ${fullName}`.toLowerCase().includes(needle);
    });
  }, [query, users]);

  const handleFollowToggle = async (targetUser) => {
    const targetId = targetUser.id ?? targetUser.userId;
    if (!targetId || String(targetId) === String(currentUserId)) return;

    try {
      setUpdatingId(targetId);
      const alreadyFollowing = Boolean(followingMap[targetId]);

      if (alreadyFollowing) await unfollowUser(targetId);
      else await followUser(targetId);

      setFollowingMap((prev) => ({ ...prev, [targetId]: !alreadyFollowing }));
      onFollowChanged?.();
    } catch {  } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90000] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={onClose}
    >
      <div
        className="flex h-[420px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative flex h-11 shrink-0 items-center justify-center border-b border-primary">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="absolute right-3">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-secondary p-3">
          <label className="flex h-9 items-center gap-2 rounded-lg bg-tertiary px-3 text-secondary">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-secondary"
              autoFocus
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-secondary">
              Loading {title.toLowerCase()}...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-secondary">
              No {title.toLowerCase()} found.
            </div>
          ) : (
            filteredUsers.map((item) => {
              const itemId = item.id ?? item.userId;
              const isCurrentUser = String(itemId) === String(currentUserId);
              const isFollowing = Boolean(followingMap[itemId]);

              return (
                <div key={itemId || item.username} className="flex items-center gap-3 px-4 py-2">
                  <button type="button" onClick={() => { onClose(); navigate(`/profile/${itemId}`); }} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <img
                      src={getAvatarUrl(item)}
                      alt={item.username || "user"}
                      className="h-11 w-11 rounded-full object-cover shrink-0"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.username || "user"}</p>
                      <p className="truncate text-sm text-secondary">{item.fullName || item.name || ""}</p>
                    </div>
                  </button>

                  {!isCurrentUser && (
                    <button
                      type="button"
                      disabled={updatingId === itemId}
                      onClick={() => handleFollowToggle(item)}
                      className={`h-8 shrink-0 rounded-lg px-4 text-sm font-semibold disabled:opacity-50 ${
                        isFollowing
                          ? "bg-tertiary text-primary hover:bg-secondary"
                          : "bg-[#0095f6] text-white hover:bg-[#1877f2]"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowersModal;
