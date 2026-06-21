import { useEffect, useState } from "react";
import { X, Link, Mail, Search } from "lucide-react";
import {
  FaFacebook,
  FaWhatsapp,
  FaThreads,
  FaXTwitter,
} from "react-icons/fa6";
import { sharePost } from "../api/shareApi";
import { getUsers } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";

function ShareModal({ post, currentUserId, onClose, onShared }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const postUrl = `${window.location.origin}/post/${post.id}`;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getUsers();
      setUsers((data || []).filter((user) => user.id !== currentUserId));
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const recordShare = async (shareType, receiverId = null) => {
    if (!currentUserId) {
      alert("Please login first");
      return null;
    }

    const count = await sharePost({
      postId: post.id,
      userId: currentUserId,
      receiverId,
      shareType,
    });

    onShared?.(count);
    return count;
  };

  const copyLink = async () => {
    try {
      await recordShare("COPY_LINK");
      await navigator.clipboard.writeText(postUrl);
      setToast("Link copied!");
    } catch (error) {
      console.error(error);
      setToast("Failed to copy link");
    }
  };

  const shareToUser = async (receiverId) => {
    try {
      await recordShare("IN_APP", receiverId);
      setToast("Post shared!");
    } catch (error) {
      console.error(error);
      setToast("Share failed");
    }
  };

  const openExternal = async (type) => {
    try {
      await recordShare(type);

      const encoded = encodeURIComponent(postUrl);

      const urls = {
        WHATSAPP: `https://wa.me/?text=${encoded}`,
        FACEBOOK: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
        EMAIL: `mailto:?subject=Instagram Post&body=${encoded}`,
        THREADS: `https://www.threads.net/intent/post?text=${encoded}`,
        X: `https://twitter.com/intent/tweet?url=${encoded}`,
      };

      window.open(urls[type], "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setToast("Share failed");
    }
  };

  const filteredUsers = users.filter((user) =>
    `${user.username || ""} ${user.fullName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[90000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-[440px] max-w-[95vw] h-[600px] bg-white rounded-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[52px] flex items-center justify-center relative border-b">
          <button onClick={onClose} className="absolute left-4">
            <X className="w-7 h-7" />
          </button>
          <h2 className="font-bold text-[15px]">Share</h2>
        </div>

        <div className="p-3">
          <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loadingUsers ? (
            <p className="text-center text-sm text-gray-400 mt-10">
              Loading users...
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-10">
              No users found
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-5">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => shareToUser(user.id)}
                  className="flex flex-col items-center gap-2"
                >
                  <img
                    src={getAvatarUrl(user)}
                    alt={user.username || "user"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-semibold truncate max-w-[70px]">
                    {user.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-between gap-2">
          <button onClick={copyLink} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <Link className="w-5 h-5" />
            </div>
            <span className="text-[11px]">Copy link</span>
          </button>

          <button onClick={() => openExternal("FACEBOOK")} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <FaFacebook className="w-5 h-5" />
            </div>
            <span className="text-[11px]">Facebook</span>
          </button>

          <button onClick={() => openExternal("WHATSAPP")} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <FaWhatsapp className="w-5 h-5" />
            </div>
            <span className="text-[11px]">WhatsApp</span>
          </button>

          <button onClick={() => openExternal("EMAIL")} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-[11px]">Email</span>
          </button>

          <button onClick={() => openExternal("THREADS")} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <FaThreads className="w-5 h-5" />
            </div>
            <span className="text-[11px]">Threads</span>
          </button>

          <button onClick={() => openExternal("X")} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <FaXTwitter className="w-5 h-5" />
            </div>
            <span className="text-[11px]">X</span>
          </button>
        </div>

        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareModal;
