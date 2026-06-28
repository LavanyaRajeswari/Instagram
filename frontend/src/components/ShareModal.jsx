import { useEffect, useState } from "react";
import { X, Link, Mail, Search } from "lucide-react";
import {
  FaFacebook,
  FaWhatsapp,
  FaThreads,
  FaXTwitter,
} from "react-icons/fa6";
import { sharePost, shareStory } from "../api/shareApi";
import { getGroups, sendGroupMessage, sendMessage, startChat } from "../api/messagesApi";
import { getUsers, searchUsers } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";

function ShareModal({ post, currentUserId, onClose, onShared }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("people");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sending, setSending] = useState(false);

  const isStory = Boolean(post?.storyId || post?.itemType === "STORY");
  const isReel = Boolean(post?.reelVideoUrl || post?.itemType === "REEL");
  const shareItem = isStory ? shareStory : sharePost;
  const itemLabel = isStory ? "story" : isReel ? "reel" : "post";
  const itemUrl = new URL(`/${isStory ? "stories" : "post"}/${post.id}`, window.location.origin).href;
  const targetPath = `/${isStory ? "stories" : "post"}/${post.id}`;
  const previewUrl = isStory
    ? post?.mediaUrl
    : post?.reelVideoUrl || post?.media?.[0]?.mediaUrl || post?.imageUrls?.[0] || post?.mediaUrl || post?.imageUrl || "";

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const query = search.trim();
      if (query.length < 2) {
        loadUsers();
        return;
      }

      try {
        setLoadingUsers(true);
        const data = await searchUsers(query);
        setUsers((data || []).filter((user) => user.id !== currentUserId));
      } catch {  } finally {
        setLoadingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, currentUserId]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getUsers();
      setUsers((data || []).filter((user) => user.id !== currentUserId));
      const groupData = await getGroups().catch(() => []);
      setGroups(Array.isArray(groupData) ? groupData : []);
    } catch {  } finally {
      setLoadingUsers(false);
    }
  };

  const recordShare = async (shareType, receiverId = null) => {
    if (!currentUserId) {
      return;
    }

    const idKey = isStory ? "storyId" : "postId";
    const count = await shareItem({
      [idKey]: post.id,
      userId: currentUserId,
      receiverId,
      shareType,
    });

    onShared?.(count);
    return count;
  };

  const sendPostToChat = async (receiverId) => {
    await recordShare("IN_APP", receiverId);
    const chat = await startChat(receiverId);
    return sendMessage({
      chatId: chat.id,
      content: `Shared a ${itemLabel} ${targetPath}`,
      messageType: isStory ? "STORY" : "POST",
      mediaUrl: previewUrl || targetPath,
      mediaType: isStory ? "STORY" : "POST",
    });
  };

  const sendPostToGroup = async (groupId) => {
    await recordShare("IN_APP");
    return sendGroupMessage({
      groupId,
      content: `Shared a ${itemLabel} ${targetPath}`,
      messageType: isStory ? "STORY" : "POST",
      mediaUrl: previewUrl || targetPath,
      mediaType: isStory ? "STORY" : "POST",
    });
  };

  const copyLink = async () => {
    try {
      await recordShare("COPY_LINK");
      await navigator.clipboard.writeText(itemUrl);
      setToast("Link copied!");
    } catch {  setToast("Failed to copy link"); }
  };

  const toggleUser = (receiverId) => {
    setSelectedUserIds((prev) =>
      prev.includes(receiverId)
        ? prev.filter((id) => id !== receiverId)
        : [...prev, receiverId]
    );
  };

  const shareToSelectedUsers = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setSending(true);
      if (activeTab === "groups") await Promise.all(selectedUserIds.map((groupId) => sendPostToGroup(groupId)));
      else await Promise.all(selectedUserIds.map((receiverId) => sendPostToChat(receiverId)));
      setToast(`${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} shared!`);
      setSelectedUserIds([]);
    } catch {  setToast("Share failed"); } finally {
      setSending(false);
    }
  };

  const openExternal = async (type) => {
    try {
      await recordShare(type);

      const encoded = encodeURIComponent(itemUrl);

      const urls = {
        WHATSAPP: `https://wa.me/?text=${encoded}`,
        FACEBOOK: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
        EMAIL: `mailto:?subject=Instagram Post&body=${encoded}`,
        THREADS: `https://www.threads.net/intent/post?text=${encoded}`,
        X: `https://twitter.com/intent/tweet?url=${encoded}`,
      };

      window.open(urls[type], "_blank", "noopener,noreferrer");
    } catch {  setToast("Share failed"); }
  };

  const filteredUsers = users.filter((user) =>
    `${user.username || ""} ${user.fullName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter((group) =>
    `${group.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const visibleItems = activeTab === "groups" ? filteredGroups : filteredUsers;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[90000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-[440px] max-w-[95vw] h-[600px] bg-card rounded-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[52px] flex items-center justify-center relative border-b">
          <button onClick={onClose} className="absolute left-4">
            <X className="w-7 h-7" />
          </button>
          <h2 className="font-bold text-[15px]">Share</h2>
        </div>

        <div className="p-3">
          <div className="mb-3 grid grid-cols-2 rounded-lg bg-tertiary p-1 text-sm font-semibold">
            <button type="button" onClick={() => { setActiveTab("people"); setSelectedUserIds([]); }} className={`rounded-md py-2 ${activeTab === "people" ? "bg-card shadow-sm" : "text-secondary"}`}>
              People
            </button>
            <button type="button" onClick={() => { setActiveTab("groups"); setSelectedUserIds([]); }} className={`rounded-md py-2 ${activeTab === "groups" ? "bg-card shadow-sm" : "text-secondary"}`}>
              Groups
            </button>
          </div>
          <div className="bg-tertiary rounded-lg px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-secondary" />
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
            <p className="text-center text-sm text-secondary mt-10">
              Loading users...
            </p>
          ) : visibleItems.length === 0 ? (
            <p className="text-center text-sm text-secondary mt-10">
              No {activeTab === "groups" ? "groups" : "users"} found
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-5">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleUser(item.id)}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="relative">
                    <img
                      src={activeTab === "groups" ? item.profilePicture || "/default-avatar.png" : getAvatarUrl(item)}
                      alt={item.username || item.name || "user"}
                      className={`w-16 h-16 rounded-full object-cover ${
                        selectedUserIds.includes(item.id) ? "ring-2 ring-[#0095f6]" : ""
                      }`}
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                    />
                    {selectedUserIds.includes(item.id) && (
                      <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white bg-[#0095f6]" />
                    )}
                  </span>
                  <span className="text-[11px] font-semibold truncate max-w-[70px]">
                    {activeTab === "groups" ? item.name : item.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedUserIds.length > 0 && (
          <div className="border-t px-4 py-3">
            <button
              type="button"
              onClick={shareToSelectedUsers}
              disabled={sending}
              className="h-10 w-full rounded-lg bg-[#0095f6] text-sm font-bold text-white disabled:opacity-50"
            >
              {sending ? "Sending..." : `Send to ${selectedUserIds.length}`}
            </button>
          </div>
        )}

      <div className="border-t p-4 flex justify-between gap-2">
        <button onClick={copyLink} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-tertiary text-primary flex items-center justify-center shadow-sm">
            <Link className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[11px]">Copy link</span>
        </button>

        <button onClick={() => openExternal("FACEBOOK")} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-tertiary flex items-center justify-center shadow-sm">
            <FaFacebook className="w-5 h-5 text-[#1877f2]" />
          </div>
          <span className="text-[11px]">Facebook</span>
        </button>

        <button onClick={() => openExternal("WHATSAPP")} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-tertiary flex items-center justify-center shadow-sm">
            <FaWhatsapp className="w-5 h-5 text-[#25d366]" />
          </div>
          <span className="text-[11px]">WhatsApp</span>
        </button>

        <button onClick={() => openExternal("EMAIL")} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-tertiary flex items-center justify-center shadow-sm">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[11px]">Email</span>
        </button>

        <button onClick={() => openExternal("THREADS")} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-tertiary flex items-center justify-center shadow-sm">
            <FaThreads className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[11px]">Threads</span>
        </button>

        <button onClick={() => openExternal("X")} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-tertiary flex items-center justify-center shadow-sm">
            <FaXTwitter className="w-5 h-5 text-primary" />
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
