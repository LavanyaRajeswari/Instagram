import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Info, Phone, Trash2, UserX, Video, X } from "lucide-react";
import {
  deleteChat,
  getChatDetails,
  getChats,
  getMessages,
  markMessagesSeen,
  muteChat,
  removeChatNickname,
  searchUsersForChat,
  sendMessage,
  startAudioCall,
  startChat,
  startVideoCall,
  unmuteChat,
  updateChatNickname,
} from "../api/messagesApi";
import { reportChat } from "../api/reportsApi";
import { blockUser } from "../api/settingsApi";
import { getCurrentUser } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";

function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chatDetails, setChatDetails] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [nicknamesOpen, setNicknamesOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const query = searchText.trim();
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const users = await searchUsersForChat(query);
        setSearchResults(users.filter((user) => user.id !== currentUser?.id));
      } catch (err) {
        console.error("Failed to search users", err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, currentUser?.id]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat?.id]);

  const loadInitialData = async () => {
    setError("");
    setLoadingChats(true);

    try {
      const [me, chatList] = await Promise.all([getCurrentUser(), getChats()]);
      setCurrentUser(me);
      setChats(chatList);
    } catch (err) {
      console.error("Failed to load messages page", err);
      setError("Please login again to view messages.");
    } finally {
      setLoadingChats(false);
    }
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    setDetailsOpen(false);
    setChatDetails(null);
    setLoadingMessages(true);
    setError("");

    try {
      const data = await getMessages(chat.id);
      setMessages([...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      await markMessagesSeen(chat.id);
      setChats((prev) =>
        prev.map((item) =>
          item.id === chat.id ? { ...item, unreadCount: 0 } : item
        )
      );
    } catch (err) {
      console.error("Failed to load chat messages", err);
      setError("Could not load messages for this chat.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const refreshDetails = async (chatId = selectedChat?.id) => {
    if (!chatId) return null;
    const details = await getChatDetails(chatId);
    setChatDetails(details);
    return details;
  };

  const handleStartChat = async (user) => {
    try {
      const chat = await startChat(user.id);
      setSearchText("");
      setSearchResults([]);

      setChats((prev) => {
        const exists = prev.some((item) => item.id === chat.id);
        return exists
          ? prev.map((item) => (item.id === chat.id ? chat : item))
          : [chat, ...prev];
      });

      await openChat(chat);
    } catch (err) {
      console.error("Failed to start chat", err);
      setError("Could not start chat with this user.");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const content = messageText.trim();
    if (!content || !selectedChat) return;

    try {
      const newMessage = await sendMessage({
        chatId: selectedChat.id,
        content,
      });

      setMessages((prev) => [...prev, newMessage]);
      setMessageText("");
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                lastMessage: newMessage.content,
                lastMessageAt: newMessage.createdAt,
              }
            : chat
        )
      );
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Message send failed. Please try again.");
    }
  };

  const handleCall = async (type) => {
    if (!selectedChat) return;
    try {
      await (type === "audio" ? startAudioCall(selectedChat.id) : startVideoCall(selectedChat.id));
      const data = await getMessages(selectedChat.id);
      const ordered = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(ordered);
      const latest = ordered[ordered.length - 1];
      if (latest) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? { ...chat, lastMessage: latest.content, lastMessageAt: latest.createdAt }
              : chat
          )
        );
      }
    } catch (err) {
      console.error("Failed to start call", err);
      alert("Could not start call event.");
    }
  };

  const handleToggleMute = async () => {
    if (!selectedChat) return;
    const nextDetails = chatDetails?.muted ? await unmuteChat(selectedChat.id) : await muteChat(selectedChat.id);
    setChatDetails(nextDetails);
    setChats((prev) =>
      prev.map((chat) => (chat.id === selectedChat.id ? { ...chat, muted: nextDetails.muted } : chat))
    );
  };

  const handleDeleteChat = async () => {
    if (!selectedChat || !window.confirm("Delete this chat for you?")) return;
    await deleteChat(selectedChat.id);
    setChats((prev) => prev.filter((chat) => chat.id !== selectedChat.id));
    setSelectedChat(null);
    setMessages([]);
    setDetailsOpen(false);
  };

  const handleBlockMember = async (userId) => {
    await blockUser(userId);
    await refreshDetails();
    setActionMessage("User blocked.");
  };

  const handleReportSubmit = async ({ reason, description }) => {
    if (!selectedChat) return;
    await reportChat(selectedChat.id, { reason, description });
    setReportOpen(false);
    setActionMessage("Report submitted.");
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-white text-[#262626]">
      <aside className="w-full max-w-[380px] border-r border-[#dbdbdb] bg-white">
        <div className="border-b border-[#dbdbdb] p-5">
          <h1 className="text-xl font-bold">Messages</h1>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search users to message"
            className="mt-4 w-full rounded-lg border border-[#dbdbdb] bg-[#fafafa] px-4 py-2 text-sm outline-none focus:border-[#a8a8a8]"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="border-b border-[#dbdbdb] bg-white">
            <p className="px-5 pt-4 text-xs font-semibold uppercase text-gray-400">
              Start new chat
            </p>
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartChat(user)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#fafafa]"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.fullName}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {loadingChats ? (
          <p className="p-5 text-sm text-gray-500">Loading chats...</p>
        ) : sortedChats.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">
            No chats yet. Search a user to start messaging.
          </p>
        ) : (
          <div className="overflow-y-auto">
            {sortedChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#fafafa] ${
                  selectedChat?.id === chat.id ? "bg-[#efefef]" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={getAvatarUrl({ profilePicture: chat.profilePicture })}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{chat.nickname || chat.username}</p>
                    {chat.unreadCount > 0 && (
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    {chat.muted && <BellOff className="h-3.5 w-3.5 shrink-0" />}
                    <p className="truncate">{chat.lastMessage || "Start chatting"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      <main className="flex flex-1 flex-col">
        {!selectedChat ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#262626] text-4xl">
                ✉
              </div>
              <h2 className="text-2xl font-light">Your messages</h2>
              <p className="mt-2 text-sm text-gray-500">
                Search and select a user to start chatting.
              </p>
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-[#dbdbdb] p-4">
              <img
                src={getAvatarUrl({ profilePicture: selectedChat.profilePicture })}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{selectedChat.nickname || selectedChat.username}</p>
                <p className="text-xs text-gray-500">
                  {selectedChat.online ? "Active now" : "Instagram user"}
                </p>
              </div>
              <button type="button" onClick={() => handleCall("audio")} className="rounded-full p-2 hover:bg-[#f2f2f2]" aria-label="Start audio call">
                <Phone className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => handleCall("video")} className="rounded-full p-2 hover:bg-[#f2f2f2]" aria-label="Start video call">
                <Video className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDetailsOpen((open) => !open);
                  if (!chatDetails) await refreshDetails();
                }}
                className="rounded-full p-2 hover:bg-[#f2f2f2]"
                aria-label="Open chat details"
              >
                <Info className="h-5 w-5" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1">
              <section className="flex-1 space-y-3 overflow-y-auto bg-white p-5">
                {loadingMessages ? (
                  <p className="text-center text-sm text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    No messages yet. Say hello 👋
                  </p>
                ) : (
                  <>
                  {messages.map((msg) => {
                    const mine = msg.senderId === currentUser?.id;
                    const isCall = msg.type === "CALL";
                    if (isCall) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="rounded-full bg-[#f2f2f2] px-4 py-2 text-xs font-semibold text-[#737373]">
                            {msg.content} · {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[65%] rounded-3xl px-4 py-2 text-sm ${
                            mine
                              ? "bg-[#3797f0] text-white"
                              : "bg-[#efefef] text-[#262626]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <p
                            className={`mt-1 text-[10px] ${
                              mine ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                  </>
                )}
              </section>

              {detailsOpen && (
                <ChatDetailsPanel
                  details={chatDetails}
                  currentUserId={currentUser?.id}
                  onClose={() => setDetailsOpen(false)}
                  onToggleMute={handleToggleMute}
                  onNicknames={() => setNicknamesOpen(true)}
                  onBlock={handleBlockMember}
                  onReport={() => setReportOpen(true)}
                  onDelete={handleDeleteChat}
                  actionMessage={actionMessage}
                />
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-[#dbdbdb] p-4">
              <div className="flex items-center gap-3 rounded-full border border-[#dbdbdb] px-4 py-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 border-0 bg-transparent text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="text-sm font-semibold text-[#0095f6] disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {reportOpen && (
        <ReportModal onClose={() => setReportOpen(false)} onSubmit={handleReportSubmit} />
      )}
      {nicknamesOpen && (
        <NicknameModal
          details={chatDetails}
          onClose={() => setNicknamesOpen(false)}
          onSave={async (userId, nickname) => {
            const nextDetails = nickname
              ? await updateChatNickname(selectedChat.id, userId, nickname)
              : await removeChatNickname(selectedChat.id, userId);
            setChatDetails(nextDetails);
            const otherNickname = nextDetails.nicknames?.[selectedChat.otherUserId];
            setSelectedChat((chat) => ({ ...chat, nickname: otherNickname || "" }));
            setChats((prev) =>
              prev.map((chat) => (chat.id === selectedChat.id ? { ...chat, nickname: otherNickname || "" } : chat))
            );
          }}
        />
      )}
    </div>
  );
}

function ChatDetailsPanel({ details, currentUserId, onClose, onToggleMute, onNicknames, onBlock, onReport, onDelete, actionMessage }) {
  const otherMembers = (details?.members || []).filter((member) => member.id !== currentUserId);

  return (
    <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-[#dbdbdb] bg-white">
      <div className="flex items-center justify-between border-b border-[#dbdbdb] p-4">
        <h2 className="font-bold">Details</h2>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-[#f2f2f2]" aria-label="Close details">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-1 border-b border-[#dbdbdb] p-3">
        <button type="button" onClick={onToggleMute} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#fafafa]">
          <span className="flex items-center gap-3">{details?.muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />} Mute messages</span>
          <span className={`h-5 w-9 rounded-full ${details?.muted ? "bg-[#0095f6]" : "bg-[#dbdbdb]"}`}>
            <span className={`block h-5 w-5 rounded-full bg-white shadow ${details?.muted ? "translate-x-4" : ""}`} />
          </span>
        </button>
        <button type="button" onClick={onNicknames} className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#fafafa]">
          Nicknames
        </button>
      </div>
      <div className="border-b border-[#dbdbdb] p-4">
        <h3 className="mb-3 text-sm font-bold">Members</h3>
        {(details?.members || []).map((member) => (
          <div key={member.id} className="flex items-center gap-3 py-2">
            <img src={getAvatarUrl(member)} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{member.nickname || member.username}</p>
              <p className="truncate text-xs text-[#737373]">{member.fullName}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1 p-3">
        {otherMembers.map((member) => (
          <button key={member.id} type="button" onClick={() => onBlock(member.id)} disabled={member.blocked} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#ed4956] hover:bg-[#fff5f5] disabled:opacity-50">
            <UserX className="h-5 w-5" />
            {member.blocked ? "Blocked" : `Block ${member.username}`}
          </button>
        ))}
        <button type="button" onClick={onReport} className="flex w-full items-center rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#ed4956] hover:bg-[#fff5f5]">
          Report
        </button>
        <button type="button" onClick={onDelete} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#ed4956] hover:bg-[#fff5f5]">
          <Trash2 className="h-5 w-5" />
          Delete chat
        </button>
        {actionMessage && <p className="px-3 pt-2 text-xs font-semibold text-green-600">{actionMessage}</p>}
      </div>
    </aside>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState("Spam");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ reason, description });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-5">
        <h2 className="text-lg font-bold">Report chat</h2>
        <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-4 h-11 w-full rounded-lg border border-[#dbdbdb] px-3 text-sm">
          {["Spam", "Harassment", "Scam or fraud", "Hate speech", "Other"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add details" className="mt-3 min-h-24 w-full rounded-lg border border-[#dbdbdb] p-3 text-sm outline-none" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dbdbdb] px-4 py-2 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#ed4956] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Submit</button>
        </div>
      </form>
    </div>
  );
}

function NicknameModal({ details, onClose, onSave }) {
  const [values, setValues] = useState(() => {
    const entries = {};
    (details?.members || []).forEach((member) => {
      entries[member.id] = member.nickname || "";
    });
    return entries;
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5">
        <h2 className="text-lg font-bold">Nicknames</h2>
        <div className="mt-4 space-y-3">
          {(details?.members || []).map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <img src={getAvatarUrl(member)} alt="" className="h-10 w-10 rounded-full object-cover" />
              <input value={values[member.id] || ""} onChange={(event) => setValues((prev) => ({ ...prev, [member.id]: event.target.value }))} placeholder={member.username} className="min-w-0 flex-1 rounded-lg border border-[#dbdbdb] px-3 py-2 text-sm outline-none" />
              <button type="button" onClick={() => onSave(member.id, values[member.id]?.trim())} className="rounded-lg bg-[#0095f6] px-3 py-2 text-xs font-bold text-white">Save</button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dbdbdb] px-4 py-2 text-sm font-bold">Done</button>
        </div>
      </div>
    </div>
  );
}

export default Messages;
