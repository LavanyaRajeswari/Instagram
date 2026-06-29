import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Maximize2, MessageCircle, X } from "lucide-react";
import { getChats, getMessages, markMessagesSeen, sendMessage } from "../api/messagesApi";
import { getCurrentUser } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";
import { connect, subscribeToChat, subscribeToTyping, sendTyping } from "../hooks/useWebSocket";

function MiniMessenger() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState({});
  const bottomRef = useRef(null);
  const lastTypingRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCurrentUser(), getChats()])
      .then(([me, chatList]) => {
        setCurrentUser(me);
        setChats(Array.isArray(chatList) ? chatList : []);
      })
      .catch(() => {
        setChats([]);
      });
    connect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    const unsubs = [];

    const unsubMsg = subscribeToChat(selectedChat.id, (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    unsubs.push(unsubMsg);

    const unsubTyping = subscribeToTyping(selectedChat.id, (data) => {
      setTyping((prev) => ({ ...prev, [selectedChat.id]: data }));
    });
    unsubs.push(unsubTyping);

    return () => {
      unsubs.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      sendTyping(selectedChat.id, currentUser.id, false);
      setTyping((prev) => {
        const next = { ...prev };
        delete next[selectedChat.id];
        return next;
      });
    };
  }, [selectedChat, currentUser]);

  const sortedChats = useMemo(
    () =>
      [...chats].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      }),
    [chats]
  );

  const unreadCount = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);

  const openChat = async (chat) => {
    setSelectedChat(chat);
    const data = await getMessages(chat.id);
    setMessages([...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    await markMessagesSeen(chat.id);
    setChats((prev) => prev.map((item) => (item.id === chat.id ? { ...item, unreadCount: 0 } : item)));
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || !selectedChat) return;

    const message = await sendMessage({ chatId: selectedChat.id, content });
    setMessages((prev) => [...prev, message]);
    setText("");
    sendTyping(selectedChat.id, currentUser.id, false);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id ? { ...chat, lastMessage: message.content, lastMessageAt: message.createdAt } : chat
      )
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70] hidden lg:block">
      {open && (
        <div className="mb-3 flex h-[600px] w-[360px] flex-col overflow-hidden rounded-xl border border-primary bg-card shadow-2xl max-sm:h-[80vh] max-sm:w-[calc(100vw-32px)]">
          <div className="flex h-12 items-center justify-between border-b border-primary px-4">
            <div className="flex items-center gap-2">
              {selectedChat && (
                <button type="button" onClick={() => setSelectedChat(null)} className="rounded-full p-1 hover:bg-hover">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <span className="text-sm font-bold">
                {selectedChat ? selectedChat.username : "Messages"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => navigate('/messages' + (selectedChat ? '?userId=' + (selectedChat.otherUserId || selectedChat.user?.id) : ''))} className="rounded-full p-1 hover:bg-hover">
                <Maximize2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!selectedChat ? (
            <div className="flex-1 overflow-y-auto">
              {sortedChats.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-secondary">No conversations yet</p>
              ) : (
                sortedChats.map((chat) => (
                  <button key={chat.id} type="button" onClick={() => openChat(chat)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary">
                    <img src={getAvatarUrl({ profilePicture: chat.profilePicture })} alt="" className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{chat.username}</p>
                      <p className="truncate text-xs text-secondary">{chat.lastMessage || "Start a conversation"}</p>
                    </div>
                    {chat.unreadCount > 0 && <span className="rounded-full bg-[#0095f6] px-2 py-0.5 text-xs font-bold text-white">{chat.unreadCount}</span>}
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((message) => {
                  const mine = message.senderId === currentUser?.id;
                  if (message.type === "CALL") {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="rounded-full bg-tertiary px-3 py-1.5 text-[11px] font-semibold text-secondary">
                          {message.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[#3797f0] text-white" : "bg-tertiary text-primary"}`}>
                        <p className="break-words">{message.content}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-secondary"}`}>
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {selectedChat && typing[selectedChat.id]?.typing && typing[selectedChat.id]?.userId !== currentUser?.id && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-tertiary px-3 py-2 text-sm text-primary">
                      <p className="text-xs italic text-secondary">typing...</p>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-primary p-3">
                <div className="flex items-center gap-2 rounded-full border border-primary px-3 py-2">
                  <input value={text} onChange={(event) => {
                    const value = event.target.value;
                    setText(value);
                    const now = Date.now();
                    if (selectedChat && currentUser && now - lastTypingRef.current > 2000) {
                      sendTyping(selectedChat.id, currentUser.id, value.length > 0);
                      lastTypingRef.current = now;
                    }
                  }} placeholder="Message..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  <button type="submit" disabled={!text.trim()} className="text-sm font-semibold text-[#0095f6] disabled:opacity-40">
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} className="relative flex h-[52px] items-center gap-3 rounded-full border border-primary bg-card px-8 min-w-[120px] text-sm font-bold shadow-lg hover:bg-hover">
        <MessageCircle className="h-6 w-6" />
        Messages
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#ed4956] px-2 py-0.5 text-xs text-white">{unreadCount}</span>}
      </button>
    </div>
  );
}

export default React.memo(MiniMessenger);
