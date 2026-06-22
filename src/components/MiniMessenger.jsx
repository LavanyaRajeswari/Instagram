import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { getChats, getMessages, markMessagesSeen, sendMessage } from "../api/messagesApi";
import { getCurrentUser } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";

function MiniMessenger() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([getCurrentUser(), getChats()])
      .then(([me, chatList]) => {
        setCurrentUser(me);
        setChats(Array.isArray(chatList) ? chatList : []);
      })
      .catch(() => {
        setChats([]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

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
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id ? { ...chat, lastMessage: message.content, lastMessageAt: message.createdAt } : chat
      )
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70] hidden lg:block">
      {open && (
        <div className="mb-3 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-xl border border-[#dbdbdb] bg-white shadow-2xl">
          <div className="flex h-12 items-center justify-between border-b border-[#dbdbdb] px-4">
            <button type="button" onClick={() => setSelectedChat(null)} className="text-sm font-bold">
              {selectedChat ? selectedChat.username : "Messages"}
            </button>
            <button type="button" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {!selectedChat ? (
            <div className="flex-1 overflow-y-auto">
              {sortedChats.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-500">No conversations yet</p>
              ) : (
                sortedChats.map((chat) => (
                  <button key={chat.id} type="button" onClick={() => openChat(chat)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#fafafa]">
                    <img src={getAvatarUrl({ profilePicture: chat.profilePicture })} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{chat.username}</p>
                      <p className="truncate text-xs text-gray-500">{chat.lastMessage || "Start chatting"}</p>
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
                        <div className="rounded-full bg-[#f2f2f2] px-3 py-1.5 text-[11px] font-semibold text-[#737373]">
                          {message.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[#3797f0] text-white" : "bg-[#efefef] text-[#262626]"}`}>
                        <p className="break-words">{message.content}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-gray-500"}`}>
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-[#dbdbdb] p-3">
                <div className="flex items-center gap-2 rounded-full border border-[#dbdbdb] px-3 py-2">
                  <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  <button type="submit" disabled={!text.trim()} className="text-sm font-semibold text-[#0095f6] disabled:opacity-40">
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} className="relative flex h-[52px] items-center gap-3 rounded-full border border-[#dbdbdb] bg-white px-5 text-sm font-bold shadow-lg hover:bg-[#f7f7f7]">
        <MessageCircle className="h-6 w-6" />
        Messages
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#ed4956] px-2 py-0.5 text-xs text-white">{unreadCount}</span>}
      </button>
    </div>
  );
}

export default MiniMessenger;
