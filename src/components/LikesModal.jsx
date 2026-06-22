import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPostLikeUsers } from "../api/likesApi";
import { followUser, isFollowingUser, unfollowUser } from "../api/followApi";
import { getAvatarUrl } from "../utils/avatar";

function LikesModal({ postId, currentUserId, onClose }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const likeUsers = await getPostLikeUsers(postId);
        if (!active) return;
        setUsers(likeUsers);

        const statuses = {};
        await Promise.all(
          likeUsers
            .filter((user) => currentUserId && user.id !== currentUserId)
            .map(async (user) => {
              try {
                statuses[user.id] = await isFollowingUser(user.id);
              } catch {
                statuses[user.id] = false;
              }
            })
        );
        if (active) setFollowing(statuses);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [postId, currentUserId]);

  const goToProfile = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  const toggleFollow = async (userId) => {
    if (following[userId]) {
      await unfollowUser(userId);
      setFollowing((prev) => ({ ...prev, [userId]: false }));
    } else {
      await followUser(userId);
      setFollowing((prev) => ({ ...prev, [userId]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-[24000] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex h-[420px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white" onClick={(event) => event.stopPropagation()}>
        <div className="relative flex h-11 items-center justify-center border-b border-[#dbdbdb]">
          <h2 className="text-sm font-bold">Likes</h2>
          <button type="button" onClick={onClose} className="absolute right-3 top-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-12 text-center text-sm text-gray-500">Loading likes...</p>
          ) : users.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No likes yet</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => goToProfile(user.id)} className="shrink-0">
                  <img src={getAvatarUrl(user)} alt="" className="h-11 w-11 rounded-full object-cover" />
                </button>
                <button type="button" onClick={() => goToProfile(user.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-[#262626]">{user.username}</p>
                  <p className="truncate text-sm text-gray-500">{user.fullName}</p>
                </button>
                {currentUserId && user.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => toggleFollow(user.id)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
                      following[user.id] ? "bg-[#efefef] text-[#262626]" : "bg-[#0095f6] text-white"
                    }`}
                  >
                    {following[user.id] ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default LikesModal;
