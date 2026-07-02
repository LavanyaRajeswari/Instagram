import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Download, ExternalLink, Info, Maximize2, MoreHorizontal, Pencil, Phone, Reply, Trash2, UserPlus, UserX, Video, X, Smile, Image, Mic, Plus, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  deleteChat,
  deleteGroupMessage,
  deleteMessageById,
  editGroupMessage,
  editMessage,
  addGroupMember,
  createGroup,
  getGroup,
  getChats,
  getGroupMessages,
  getGroups,
  getMessages,
  leaveGroup,
  markGroupMessagesSeen,
  markMessagesSeen,
  muteChatUntil,
  reactToGroupMessage,
  reactToMessage,
  removeChatNickname,
  searchUsersForChat,
  sendMessage,
  sendGroupMessage,
  startChat,
  unmuteChat,
  updateChatNickname,
  uploadMessageMedia,
} from "../api/messagesApi";
import { createReport } from "../api/reportsApi";
import { blockUser } from "../api/settingsApi";
import { getCurrentUser, getUser } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";
import { connect, subscribeToChat, subscribeToGroup, subscribeToTyping, sendTyping } from "../hooks/useWebSocket";
import NotesBar from "../components/NotesBar";
import EmojiPicker from "emoji-picker-react";

function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeInboxTab, setActiveInboxTab] = useState("primary");
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
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
  const [muteOpen, setMuteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const bottomRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const selectedChatSubs = useRef([]);
  const chatListSubs = useRef({});
  const groupListSubs = useRef({});
  const selectedChatRef = useRef(null);
  const selectedGroupRef = useRef(null);
  const initializedThreadRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const [messageEmojiOpen, setMessageEmojiOpen] = useState(false);
  const messageEmojiRef = useRef(null);
  const mediaInputRef = useRef(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      Object.values(chatListSubs.current).forEach((unsub) => unsub?.());
      chatListSubs.current = {};
      Object.values(groupListSubs.current).forEach((unsub) => unsub?.());
      groupListSubs.current = {};
      selectedChatSubs.current.forEach((unsub) => unsub());
      selectedChatSubs.current = [];
      stopRecordingTimer();
      mediaRecorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop());
    };
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
      } catch {  }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, currentUser?.id]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    const handleClick = (event) => {
      if (messageEmojiOpen && messageEmojiRef.current && !messageEmojiRef.current.contains(event.target)) {
        setMessageEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [messageEmojiOpen]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    if (userId && chats.length > 0) {
      const chat = chats.find(c => String(c.otherUserId) === userId);
      if (chat) {
        openChat(chat);
      } else {
        const user = { id: parseInt(userId) };
        handleStartChat(user);
      }
    }
  }, [chats, location.search]);

  useEffect(() => {
    if (initializedThreadRef.current || loadingChats) return;
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const chatId = params.get("chatId");
    const groupId = params.get("groupId");
    if (tab === "groups") setActiveInboxTab("groups");
    if (groupId && groups.length > 0) {
      const group = groups.find((item) => String(item.id) === String(groupId));
      if (group) {
        initializedThreadRef.current = true;
        openGroup(group, { replace: true });
        return;
      }
    }
    if (chatId && chats.length > 0) {
      const chat = chats.find((item) => String(item.id) === String(chatId));
      if (chat) {
        initializedThreadRef.current = true;
        openChat(chat, { replace: true });
        return;
      }
    }
    initializedThreadRef.current = true;
  }, [loadingChats, groups, chats, location.search]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [chats]);

  const primaryChats = useMemo(() => sortedChats.filter((c) => !c.isBlocked), [sortedChats]);
  const dedupedPrimaryChats = useMemo(() => {
    const seen = new Set();
    return primaryChats.filter((chat) => {
      const key = String(chat.otherUserId || chat.user?.id || chat.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [primaryChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat?.id, selectedGroup?.id]);

  useEffect(() => {
    selectedChatSubs.current.forEach((unsub) => unsub());
    selectedChatSubs.current = [];

    if (!selectedChat?.id || selectedGroup?.id) return;

    const chatId = selectedChat.id;

    const unsubMsg = subscribeToChat(chatId, (newMessage) => {
      window.dispatchEvent(new CustomEvent("message-new"));
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
    });
    selectedChatSubs.current.push(unsubMsg);

    const unsubTyping = subscribeToTyping(chatId, (typingDto) => {
      if (typingDto.userId === currentUser?.id) return;
      if (typingDto.typing) {
        setTypingUsers((prev) => ({ ...prev, [chatId]: typingDto.userId }));
      } else {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[chatId];
          return next;
        });
      }
    });
    selectedChatSubs.current.push(unsubTyping);

    return () => {
      selectedChatSubs.current.forEach((unsub) => unsub());
      selectedChatSubs.current = [];
    };
  }, [selectedChat?.id, selectedGroup?.id, currentUser?.id]);

  useEffect(() => {
    const subs = chatListSubs.current;
    const currentIds = new Set(chats.map((c) => c.id));

    Object.keys(subs).forEach((id) => {
      if (!currentIds.has(Number(id))) {
        subs[id]?.();
        delete subs[id];
      }
    });

    chats.forEach((chat) => {
      if (subs[chat.id]) return;
      subs[chat.id] = subscribeToChat(chat.id, (newMessage) => {
        window.dispatchEvent(new CustomEvent("message-new"));
        setChats((prev) =>
          prev.map((c) =>
            c.id === chat.id
              ? {
                  ...c,
                  lastMessage: newMessage.content,
                  lastMessageAt: newMessage.createdAt,
                  unreadCount:
                    selectedChatRef.current?.id === chat.id || String(newMessage.senderId) === String(currentUser?.id)
                      ? 0
                      : (c.unreadCount || 0) + 1,
                }
              : c
          )
        );
      });
    });
  }, [chats]);

  useEffect(() => {
    const subs = groupListSubs.current;
    const currentIds = new Set(groups.map((g) => g.id));

    Object.keys(subs).forEach((id) => {
      if (!currentIds.has(Number(id))) {
        subs[id]?.();
        delete subs[id];
      }
    });

    groups.forEach((group) => {
      if (subs[group.id]) return;
      subs[group.id] = subscribeToGroup(group.id, (newMessage) => {
        window.dispatchEvent(new CustomEvent("message-new"));
        setGroups((prev) =>
          prev.map((g) =>
            g.id === group.id
              ? {
                  ...g,
                  lastMessage: newMessage.content || g.lastMessage,
                  lastMessageAt: newMessage.createdAt,
                  unreadCount:
                    selectedGroupRef.current?.id === group.id || String(newMessage.senderId) === String(currentUser?.id)
                      ? 0
                      : (g.unreadCount || 0) + 1,
                }
              : g
          )
        );
        if (selectedGroupRef.current?.id === group.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          });
        }
      });
    });
  }, [groups]);

  const loadInitialData = async () => {
    setError("");
    setLoadingChats(true);

    try {
      const [me, chatList, groupList] = await Promise.all([getCurrentUser(), getChats(), getGroups().catch(() => [])]);
      setCurrentUser(me);
      setChats(chatList);
      setGroups(groupList);
    } catch (err) {
      setError("Please login again to view messages.");
    } finally {
      setLoadingChats(false);
    }
  };

  const updateThreadUrl = (params, options = {}) => {
    const search = new URLSearchParams(params).toString();
    navigate(`/messages${search ? `?${search}` : ""}`, { replace: Boolean(options.replace) });
  };

  const openChat = async (chat, options = {}) => {
    setSelectedChat(chat);
    setSelectedGroup(null);
    setActiveInboxTab("primary");
    setGroupDetailsOpen(false);
    updateThreadUrl({ tab: "primary", chatId: chat.id }, options);
    setDetailsOpen(false);
    setChatDetails(null);
    setLoadingMessages(true);
    setError("");

    try {
      const data = await getMessages(chat.id);
      setMessages([...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      await markMessagesSeen(chat.id);
      window.dispatchEvent(new CustomEvent("messages-seen"));
      setChats((prev) =>
        prev.map((item) =>
          item.id === chat.id ? { ...item, unreadCount: 0 } : item
        )
      );
    } catch (err) {
      setError("Could not load messages for this chat.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const openGroup = async (group, options = {}) => {
    setSelectedGroup(group);
    setSelectedChat(null);
    setActiveInboxTab("groups");
    setGroupDetailsOpen(false);
    updateThreadUrl({ tab: "groups", groupId: group.id }, options);
    setDetailsOpen(false);
    setChatDetails(null);
    setLoadingMessages(true);
    setError("");

    try {
      const data = await getGroupMessages(group.id);
      setMessages([...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      await markGroupMessagesSeen(group.id).catch(() => {});
      window.dispatchEvent(new CustomEvent("messages-seen"));
      setGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, unreadCount: 0 } : g));
    } catch {
      setError("Could not load messages for this group.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const getOtherUserId = (chat = selectedChat) => chat?.otherUserId || chat?.user?.id;

  const buildChatDetails = async (chat = selectedChat) => {
    if (!chat || !currentUser) return null;
    let otherUser = {
      id: getOtherUserId(chat),
      username: chat.username,
      fullName: chat.fullName || "",
      profilePicture: chat.profilePicture,
      nickname: chat.nickname || "",
      blocked: chat.blocked || false,
    };

    if (otherUser.id) {
      try {
        const user = await getUser(otherUser.id);
        otherUser = { ...otherUser, ...user, nickname: chat.nickname || user.nickname || "" };
      } catch {  }
    }

    return {
      id: chat.id,
      muted: Boolean(chat.muted),
      muteUntil: chat.muteUntil,
      members: [
        { ...currentUser, nickname: currentUser.nickname || "" },
        otherUser,
      ].filter((member) => member.id),
      nicknames: {
        [currentUser.id]: currentUser.nickname || "",
        [otherUser.id]: chat.nickname || otherUser.nickname || "",
      },
    };
  };

  const refreshDetails = async (chat = selectedChat) => {
    if (!chat) return null;
    const details = await buildChatDetails(chat);
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
      setError("Could not start chat with this user.");
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const content = messageText.trim();
    if (!content || (!selectedChat && !selectedGroup)) return;

    try {
      const newMessage = selectedGroup
        ? await sendGroupMessage({ groupId: selectedGroup.id, content, replyToId: replyingTo?.id })
        : await sendMessage({
            chatId: selectedChat.id,
            content,
            replyToId: replyingTo?.id,
          });

      upsertMessage(newMessage);
      window.dispatchEvent(new CustomEvent("message-new"));
      setMessageText("");
      setReplyingTo(null);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (selectedChat) {
        sendTyping(selectedChat.id, currentUser.id, false);
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
      } else {
        setGroups((prev) =>
          prev.map((group) =>
            group.id === selectedGroup.id
              ? { ...group, lastMessage: newMessage.content, lastMessageAt: newMessage.createdAt }
              : group
          )
        );
      }
    } catch {  }
  };

  const upsertMessage = (nextMessage) => {
    setMessages((prev) =>
      prev.some((message) => message.id === nextMessage.id)
        ? prev.map((message) => (message.id === nextMessage.id ? { ...message, ...nextMessage } : message))
        : [...prev, nextMessage]
    );
  };

  const handleMediaSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || (!selectedChat && !selectedGroup)) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingMedia({
      file,
      previewUrl,
      type: file.type.startsWith("video/") ? "VIDEO" : file.type.startsWith("audio/") ? "AUDIO" : "IMAGE",
    });
  };

  const sendPendingMedia = async () => {
    if (!pendingMedia || (!selectedChat && !selectedGroup)) return;
    setUploadingMedia(true);
    setError("");
    try {
      const file = pendingMedia.file;
      const upload = await uploadMessageMedia(file);
      const fallbackType = file.type.startsWith("video/") ? "VIDEO" : file.type.startsWith("audio/") ? "AUDIO" : "IMAGE";
      const payload = {
        content: upload.mediaUrl,
        messageType: upload.messageType || fallbackType,
        mediaUrl: upload.mediaUrl,
        mediaType: upload.mediaType || file.type,
        replyToId: replyingTo?.id,
      };
      const newMessage = selectedGroup
        ? await sendGroupMessage({ groupId: selectedGroup.id, ...payload })
        : await sendMessage({ chatId: selectedChat.id, ...payload });
      upsertMessage(newMessage);
      window.dispatchEvent(new CustomEvent("message-new"));
      setReplyingTo(null);
      setPendingMedia((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
    } catch {
      setError("Could not send this media. Please try again.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const getRecordingMimeType = () => {
    if (!window.MediaRecorder) return "";
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const sendAudioBlob = async (blob) => {
    if (!blob?.size || (!selectedChat && !selectedGroup)) return;

    setUploadingMedia(true);
    setError("");
    try {
      const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
      const audioFile = new File([blob], `voice-message-${Date.now()}.${extension}`, {
        type: blob.type || "audio/webm",
      });
      const upload = await uploadMessageMedia(audioFile);
      const payload = {
        content: upload.mediaUrl,
        messageType: "AUDIO",
        mediaUrl: upload.mediaUrl,
        mediaType: upload.mediaType || audioFile.type,
        replyToId: replyingTo?.id,
      };
      const newMessage = selectedGroup
        ? await sendGroupMessage({ groupId: selectedGroup.id, ...payload })
        : await sendMessage({ chatId: selectedChat.id, ...payload });
      upsertMessage(newMessage);
      window.dispatchEvent(new CustomEvent("message-new"));
      setReplyingTo(null);
    } catch {
      setError("Could not send this voice message. Please try again.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const startRecording = async () => {
    if (recording || uploadingMedia || (!selectedChat && !selectedGroup)) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stopRecordingTimer();
        setRecording(false);
        setRecordingSeconds(0);
        stream.getTracks().forEach((track) => track.stop());
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: blobType });
        audioChunksRef.current = [];
        await sendAudioBlob(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch {
      setError("Microphone permission is needed to record audio.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleEditMessage = async (message) => {
    const content = editingMessage?.content?.trim();
    if (!content) return;
    try {
      const updated = selectedGroup
        ? await editGroupMessage(selectedGroup.id, message.id, content)
        : await editMessage(message.id, content);
      upsertMessage(updated);
      setEditingMessage(null);
      setMessageMenu(null);
    } catch {
      setError("Could not edit this message.");
    }
  };

  const handleDeleteMessage = async (message) => {
    try {
      if (selectedGroup) {
        const updated = await deleteGroupMessage(selectedGroup.id, message.id);
        upsertMessage(updated);
      } else {
        await deleteMessageById(message.id);
        upsertMessage({ ...message, content: "[Message deleted]", deleted: true });
      }
      setMessageMenu(null);
    } catch {
      setError("Could not delete this message.");
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    setMessageMenu(null);
    setReactionTarget(null);
  };

  const handleReactToMessage = async (message, emoji) => {
    try {
      const newMessage = selectedGroup
        ? await reactToGroupMessage(selectedGroup.id, message.id, emoji)
        : await reactToMessage(message.id, emoji);
      upsertMessage(newMessage);
      window.dispatchEvent(new CustomEvent("message-new"));
      setReactionTarget(null);
      setMessageMenu(null);
    } catch {
      setError("Could not send this reaction.");
    }
  };

  const handleGroupMemberAdded = async () => {
    if (!selectedGroup?.id) return;
    try {
      const freshGroup = await getGroup(selectedGroup.id);
      setSelectedGroup(freshGroup);
      setGroups((prev) => prev.map((group) => (group.id === freshGroup.id ? freshGroup : group)));
    } catch {
      await loadInitialData();
    }
  };

  const getDownloadFileName = (url = "", contentType = "") => {
    const pathName = String(url).split("?")[0].split("/").pop();
    if (pathName && pathName.includes(".")) return pathName;
    if (contentType.includes("audio")) return "audio-message.webm";
    if (contentType.includes("video")) return "video-message.mp4";
    if (contentType.includes("image")) return "image-message.jpg";
    return pathName || "message-media";
  };

  const downloadMedia = async (url) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getDownloadFileName(url, blob.type);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadFileName(url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);

    if (!selectedChat || selectedGroup || !currentUser) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      sendTyping(selectedChat.id, currentUser.id, true);
      lastTypingSentRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(selectedChat.id, currentUser.id, false);
    }, 3000);
  };

  const getChatDisplayName = (chat = selectedChat) => chat?.nickname || chat?.username || "Instagram user";
  const selectedThread = selectedGroup || selectedChat;
  const selectedThreadName = selectedGroup?.name || getChatDisplayName();

  const applyOtherUserNickname = (chatId, userId, nickname) => {
    const displayNickname = nickname || "";
    setSelectedChat((chat) =>
      chat?.id === chatId ? { ...chat, nickname: displayNickname } : chat
    );
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, nickname: displayNickname } : chat
      )
    );
    setChatDetails((prev) =>
      prev?.id === chatId
        ? {
            ...prev,
            nicknames: { ...(prev.nicknames || {}), [userId]: displayNickname },
            members: (prev.members || []).map((member) =>
              String(member.id) === String(userId)
                ? { ...member, nickname: displayNickname }
                : member
            ),
          }
        : prev
    );
    setMessages((prev) =>
      prev.map((message) =>
        String(message.senderId) === String(userId) ||
        String(message.sender?.id) === String(userId)
          ? {
              ...message,
              senderNickname: displayNickname,
              sender: message.sender
                ? { ...message.sender, nickname: displayNickname }
                : message.sender,
            }
          : message
      )
    );
  };

  const handleCall = async (type) => {
    if (!selectedChat) return;
    const otherUserId = getOtherUserId();
    if (!otherUserId) {
     
      return;
    }

    navigate(`/call?has_video=${type === "video"}&ig_thread_id=${selectedChat.id}&userId=${otherUserId}`, {
      state: {
        autoStart: true,
        chatId: selectedChat.id,
        otherUserId,
        username: getChatDisplayName(),
        profilePicture: selectedChat.profilePicture,
        returnTo: `/messages?tab=primary&chatId=${selectedChat.id}`,
      },
    });
  };

  const handleGroupCall = async (type) => {
    if (!selectedGroup) return;
    navigate(`/call?has_video=${type === "video"}&groupId=${selectedGroup.id}`, {
      state: {
        autoStart: true,
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        groupProfilePicture: selectedGroup.profilePicture,
        username: selectedGroup.name,
        profilePicture: selectedGroup.profilePicture,
        returnTo: `/messages?tab=groups&groupId=${selectedGroup.id}`,
      },
    });
  };

  const handleToggleMute = async () => {
    if (!selectedChat) return;
    if (!chatDetails?.muted) {
      setActionMessage("");
      setMuteOpen(true);
      return;
    }

    setActionMessage("");
    const previousChat = selectedChat;
    const previousDetails = chatDetails;
    updateSelectedChat({ muted: false, muteUntil: null });
    setChatDetails((prev) => (prev ? { ...prev, muted: false, muteUntil: null } : prev));

    try {
      await unmuteChat(selectedChat.id);
    } catch (error) {
      setSelectedChat(previousChat);
      setChatDetails(previousDetails);
      setChats((prev) => prev.map((chat) => (chat.id === previousChat.id ? previousChat : chat)));
      setActionMessage("Mute settings were not updated. Please try again.");
    }
  };

  const updateSelectedChat = (updates) => {
    setSelectedChat((chat) => (chat ? { ...chat, ...updates } : chat));
    setChats((prev) =>
      prev.map((chat) => (chat.id === selectedChat?.id ? { ...chat, ...updates } : chat))
    );
  };

  const handleMuteChoice = async (hours) => {
    if (!selectedChat) return;
    const muteUntil = hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString().slice(0, 19) : null;
    const previousChat = selectedChat;
    const previousDetails = chatDetails;
    setActionMessage("");
    updateSelectedChat({ muted: true, muteUntil });
    setChatDetails((prev) => (prev ? { ...prev, muted: true, muteUntil } : prev));
    setMuteOpen(false);

    try {
      await muteChatUntil(selectedChat.id, muteUntil);
    } catch (error) {
      setSelectedChat(previousChat);
      setChatDetails(previousDetails);
      setChats((prev) => prev.map((chat) => (chat.id === previousChat.id ? previousChat : chat)));
      setActionMessage("Mute settings were not updated. Please try again.");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    try {
      await deleteChat(selectedChat.id);
      setChats((prev) => prev.filter((chat) => chat.id !== selectedChat.id));
      setSelectedChat(null);
      setMessages([]);
      setDetailsOpen(false);
      setDeleteConfirmOpen(false);
    } catch {  }
  };

  const handleBlockMember = async () => {
    if (!blockTarget?.id) return;
    try {
      await blockUser(blockTarget.id);
      setChatDetails((prev) => ({
        ...prev,
        members: (prev?.members || []).map((member) =>
          member.id === blockTarget.id ? { ...member, blocked: true } : member
        ),
      }));
      setBlockTarget(null);
      setActionMessage("User blocked.");
    } catch {  }
  };

  const handleReportSubmit = async ({ reason, description }) => {
    if (!selectedChat) return;
    try {
      await createReport({
        targetType: "CHAT",
        targetId: selectedChat.id,
        reason,
        description,
      });
      setReportOpen(false);
      setActionMessage("Report submitted.");
    } catch {  }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatChatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getLastSeenText = (chat) => {
    if (!chat) return "";
    if (chat.online) return "Online";
    if (chat.lastSeen) {
      const diff = Date.now() - new Date(chat.lastSeen).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Last seen just now";
      if (mins < 60) return `Last seen ${mins} minute${mins === 1 ? "" : "s"} ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
      const days = Math.floor(hours / 24);
      return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
    }
    return "";
  };

  const getMessageSummary = (message) => {
    if (!message) return "Message";
    if (message.deleted) return "Message deleted";
    const type = String(message.messageType || "TEXT").toUpperCase();
    if (type === "IMAGE") return "Photo";
    if (type === "VIDEO") return "Video";
    if (type === "AUDIO") return "Voice message";
    if (type === "POST") return "Shared post";
    if (type === "STORY") return "Shared story";
    return message.content || "Message";
  };

  const findReplyMessage = (message) => {
    if (!message?.replyToId) return null;
    return messages.find((item) => String(item.id) === String(message.replyToId));
  };

  const parseReactions = (value) => {
    if (!value) return [];
    return String(value)
      .split(";")
      .map((entry) => {
        const [emoji, count] = entry.split("=");
        const reactionCount = count?.startsWith("u:")
          ? count.slice(2).split(",").filter(Boolean).length
          : Number(count) || 1;
        return emoji ? { emoji, count: reactionCount } : null;
      })
      .filter(Boolean);
  };

  return (
    <div className="flex h-screen bg-card text-primary">
      <aside className="flex w-full max-w-[450px] flex-col border-r border-primary bg-card">
        <div className="p-4 border-b border-primary">
          <h1 className="text-xl font-bold mb-3">Messages</h1>
          <NotesBar />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search users to message"
            className="mt-4 w-full rounded-lg border border-primary bg-secondary px-4 py-2 text-sm outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center border-b border-primary">
          <button
            type="button"
            onClick={() => {
              setActiveInboxTab("primary");
              updateThreadUrl({ tab: "primary" });
            }}
            className={`flex-1 py-3 text-center text-sm font-semibold ${activeInboxTab === "primary" ? "border-b-2 border-primary" : "text-secondary"}`}
          >
            Primary
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveInboxTab("groups");
              updateThreadUrl({ tab: "groups" });
            }}
            className={`flex-1 py-3 text-center text-sm font-semibold ${activeInboxTab === "groups" ? "border-b-2 border-primary" : "text-secondary"}`}
          >
            Groups
          </button>
          <button type="button" onClick={() => setGroupCreateOpen(true)} className="mr-3 rounded-full p-2 hover:bg-hover" aria-label="Create group">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border-b border-primary bg-card">
            <p className="px-5 pt-4 text-xs font-semibold uppercase text-secondary">
              Start new chat
            </p>
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartChat(user)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-secondary"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                />
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-secondary">{user.fullName}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <>
            {activeInboxTab === "groups" ? (
              <div className="overflow-y-auto">
                {groups.length === 0 ? (
                  <p className="p-5 text-sm text-secondary">No groups yet. Create a group to start chatting.</p>
                ) : groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => openGroup(group)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-secondary ${selectedGroup?.id === group.id ? "bg-tertiary" : ""}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary">
                      {group.profilePicture ? (
                        <img src={group.profilePicture} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <Users className="h-6 w-6 text-secondary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{group.name}</p>
                        {group.unreadCount > 0 && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-secondary">{group.lastMessage || `${group.members?.length || 0} members`}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : loadingChats ? (
              <p className="p-5 text-sm text-secondary">Loading chats...</p>
            ) : dedupedPrimaryChats.length === 0 ? (
              <p className="p-5 text-sm text-secondary">
                No chats yet. Search a user to start messaging.
              </p>
            ) : (
              <div className="overflow-y-auto">
                {dedupedPrimaryChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-secondary ${
                      selectedChat?.id === chat.id ? "bg-tertiary" : ""
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={getAvatarUrl({ profilePicture: chat.profilePicture })}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
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
                      <div className="flex items-center gap-1 text-sm text-secondary">
                        {chat.muted && <BellOff className="h-3.5 w-3.5 shrink-0" />}
                        <p className="truncate">{formatLastMessage(chat.lastMessage) || "Start a conversation"}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
      </aside>

      <main className="flex flex-1 flex-col">
        {!selectedThread ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary text-4xl">
                ✉
              </div>
              <h2 className="text-2xl font-light">Your messages</h2>
              <p className="mt-2 text-sm text-secondary">
                Search and select a user to start chatting.
              </p>
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-primary p-4">
              {selectedGroup ? (
                <button type="button" onClick={() => setGroupDetailsOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary">
                  <Users className="h-5 w-5 text-secondary" />
                </button>
              ) : (
                <button type="button" onClick={() => navigate(`/profile/${getOtherUserId()}`)} className="shrink-0">
                  <img
                    src={getAvatarUrl({ profilePicture: selectedChat.profilePicture })}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                  />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => selectedGroup && setGroupDetailsOpen(true)} className="truncate font-semibold text-left">{selectedThreadName}</button>
                <p className="text-xs text-secondary">
                  {selectedGroup ? `${selectedGroup.members?.length || 0} members` : typingUsers[selectedChat.id] ? "Typing..." : getLastSeenText(selectedChat)}
                </p>
              </div>
              {selectedGroup ? (
                <>
                  <button type="button" onClick={() => handleGroupCall("audio")} className="rounded-full p-2 hover:bg-hover" aria-label="Start group audio call">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => handleGroupCall("video")} className="rounded-full p-2 hover:bg-hover" aria-label="Start group video call">
                    <Video className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={async () => { await leaveGroup(selectedGroup.id); setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id)); setSelectedGroup(null); setMessages([]); updateThreadUrl({ tab: "groups" }); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#ed4956] hover:bg-hover">
                    Leave
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => handleCall("audio")} className="rounded-full p-2 hover:bg-hover" aria-label="Start audio call">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => handleCall("video")} className="rounded-full p-2 hover:bg-hover" aria-label="Start video call">
                    <Video className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setDetailsOpen((open) => !open);
                      if (!chatDetails) await refreshDetails(selectedChat);
                    }}
                    className="rounded-full p-2 hover:bg-hover"
                    aria-label="Open chat details"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </>
              )}
            </header>

            <div className="flex min-h-0 flex-1">
              <section className="flex-1 space-y-3 overflow-y-auto bg-card p-5">
                {loadingMessages ? (
                  <p className="text-center text-sm text-secondary">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-secondary">
                    No messages yet. Say hello 👋
                  </p>
                ) : (
                  <>
                  {messages.map((msg) => {
                    const senderId = msg.senderId || msg.sender?.id;
                    const mine = senderId === currentUser?.id;
                    const msgMediaType = msg.messageType;
                    const mediaUrl = msg.mediaUrl || msg.content;
                    const isSystem = msgMediaType === "SYSTEM";
                    const senderName = mine ? "Me" : msg.senderUsername || msg.sender?.username || "User";
                    const replyMessage = findReplyMessage(msg);
                    return (
                      isSystem ? (
                        <div key={msg.id} className="flex justify-center">
                          <span className="rounded-full bg-tertiary px-3 py-1 text-xs text-secondary">{msg.content}</span>
                        </div>
                      ) : (
                      <div
                        key={msg.id}
                        className={`group/message flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        {!mine && selectedGroup && (
                          <img src={getAvatarUrl({ profilePicture: msg.senderProfilePicture || msg.sender?.profilePicture })} alt="" className="mr-2 mt-5 h-7 w-7 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                        )}
                        <div className={`relative flex max-w-[85%] flex-col ${mine ? "items-end" : "items-start"}`}>
                          {selectedGroup && (
                            <span className={`mb-1 px-2 text-[11px] font-semibold text-secondary ${mine ? "text-right" : "text-left"}`}>{senderName}</span>
                          )}
                        <div
                          id={`message-${msg.id}`}
                          className={`rounded-3xl text-sm ${
                            msgMediaType === "IMAGE" || msgMediaType === "VIDEO" || msgMediaType === "AUDIO" || msgMediaType === "POST" || msgMediaType === "STORY"
                              ? "overflow-hidden bg-transparent"
                              : `px-4 py-2 ${mine ? "bg-[#3797f0] text-white" : "bg-tertiary text-primary"}`
                          }`}
                        >
                          {msg.replyToId && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = document.getElementById(`message-${msg.replyToId}`);
                                target?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className={`mb-2 block w-full max-w-[260px] rounded-2xl px-3 py-2 text-left text-xs ${
                                mine
                                  ? "bg-white/20 text-white"
                                  : "bg-card text-primary"
                              }`}
                            >
                              <span className={`block font-semibold ${mine ? "text-white" : "text-primary"}`}>
                                {replyMessage
                                  ? String(replyMessage.senderId || replyMessage.sender?.id) === String(currentUser?.id)
                                    ? "You"
                                    : replyMessage.senderUsername || replyMessage.sender?.username || selectedThreadName
                                  : "Replying to"}
                              </span>
                              <span className={`block truncate ${mine ? "text-blue-100" : "text-secondary"}`}>{replyMessage ? getMessageSummary(replyMessage) : "Original message"}</span>
                            </button>
                          )}
                          {editingMessage?.id === msg.id ? (
                            <div className="flex w-[min(320px,calc(100vw-96px))] flex-col gap-2 rounded-2xl bg-card p-2 text-primary shadow-sm">
                              <textarea value={editingMessage.content} onChange={(event) => setEditingMessage((prev) => ({ ...prev, content: event.target.value }))} className="min-h-20 w-full resize-none rounded-lg border border-primary p-2 text-sm outline-none" />
                              <div className="flex flex-wrap justify-end gap-3 text-xs font-semibold">
                                <button type="button" onClick={() => setEditingMessage(null)} className="text-secondary">Cancel</button>
                                <button type="button" onClick={() => handleEditMessage(msg)} className="text-[#0095f6]">Save</button>
                              </div>
                            </div>
                          ) : msgMediaType === "IMAGE" ? (
                            <img src={mediaUrl} alt="Image" className="max-w-[260px] max-h-[300px] rounded-3xl object-cover cursor-pointer" onClick={() => setImagePreview(mediaUrl)} />
                          ) : msgMediaType === "VIDEO" ? (
                            <video src={mediaUrl} controls className="max-w-[260px] max-h-[300px] rounded-3xl" />
                          ) : msgMediaType === "AUDIO" ? (
                            <div className={`px-4 py-3 rounded-3xl ${mine ? "bg-[#3797f0]" : "bg-tertiary"}`}>
                              <audio src={mediaUrl} controls className="max-w-[220px] h-8" />
                              <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-secondary"}`}>{formatTime(msg.createdAt)}</p>
                            </div>
                          ) : msgMediaType === "POST" || msgMediaType === "STORY" ? (
                            <button
                              type="button"
                              onClick={() => {
                                const sharedPath = extractSharedPath(msg, mediaUrl);
                                if (sharedPath) navigate(sharedPath);
                              }}
                              className={`flex max-w-[260px] items-center gap-3 rounded-3xl px-4 py-3 text-left ${mine ? "bg-[#3797f0] text-white" : "bg-tertiary text-primary"}`}
                            >
                              {mediaUrl && !String(mediaUrl).includes("/post/") && !String(mediaUrl).includes("/stories/") ? (
                                isVideoUrl(mediaUrl) ? (
                                  <video src={mediaUrl} muted playsInline className="h-12 w-12 rounded-lg object-cover" />
                                ) : (
                                  <img src={mediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                                )
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/10">
                                  <Image className="h-5 w-5" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">{formatSharedMessageContent(msg, msgMediaType)}</span>
                                <span className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-blue-100" : "text-secondary"}`}>
                                  Open {msgMediaType.toLowerCase()} <ExternalLink className="h-3 w-3" />
                                </span>
                                <span className={`mt-1 block text-[10px] ${mine ? "text-blue-100" : "text-secondary"}`}>{formatTime(msg.createdAt)}</span>
                              </span>
                            </button>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-secondary"}`}>{formatTime(msg.createdAt)}</p>
                            </>
                          )}
                          {(msgMediaType === "IMAGE" || msgMediaType === "VIDEO") && (
                            <p className={`px-3 pb-2 text-[10px] ${mine ? "text-blue-100" : "text-secondary"}`}>{formatTime(msg.createdAt)}</p>
                          )}
                        </div>
                          {parseReactions(msg.reactions).length > 0 && (
                            <div className={`mt-1 flex max-w-[260px] flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                              {parseReactions(msg.reactions).map(({ emoji, count }) => (
                                <span key={emoji} className="rounded-full bg-card px-2 py-0.5 text-xs shadow">
                                  {emoji} {count > 1 ? count : ""}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className={`absolute top-5 flex items-center gap-1 rounded-full bg-card px-1 py-0.5 text-secondary opacity-0 shadow transition-opacity group-hover/message:opacity-100 ${mine ? "-left-24" : "-right-24"}`}>
                            <button type="button" onClick={() => handleReplyToMessage(msg)} className="rounded-full p-1 hover:bg-hover" aria-label="Reply to message">
                              <Reply className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setReactionTarget(reactionTarget?.id === msg.id ? null : msg)} className="rounded-full p-1 hover:bg-hover" aria-label="React with emoji">
                              <Smile className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setMessageMenu(messageMenu?.id === msg.id ? null : msg)} className="rounded-full p-1 hover:bg-hover" aria-label="Message options">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                          {reactionTarget?.id === msg.id && (
                            <div className={`absolute top-12 z-40 flex gap-1 rounded-full border border-primary bg-card p-1 shadow-xl ${mine ? "right-full mr-2" : "left-full ml-2"}`}>
                              {["❤️", "😂", "😮", "😢", "👏", "🔥"].map((emoji) => (
                                <button key={emoji} type="button" onClick={() => handleReactToMessage(msg, emoji)} className="h-8 w-8 rounded-full text-lg hover:bg-secondary" aria-label={`React ${emoji}`}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                          {messageMenu?.id === msg.id && (
                            <div className={`absolute top-14 z-40 w-44 overflow-hidden rounded-lg border border-primary bg-card text-sm shadow-xl ${mine ? "right-full mr-2" : "left-full ml-2"}`}>
                              <div className="border-b border-primary px-3 py-2 text-[11px] text-secondary">{formatTime(msg.createdAt)}</div>
                              <button type="button" onClick={() => handleReplyToMessage(msg)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"><Reply className="h-4 w-4" /> Reply</button>
                              {(msgMediaType === "IMAGE" || msgMediaType === "VIDEO" || msgMediaType === "AUDIO") && (
                                <>
                                  <button type="button" onClick={async () => { await downloadMedia(mediaUrl); setMessageMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"><Download className="h-4 w-4" /> Download</button>
                                  {msgMediaType === "IMAGE" && <button type="button" onClick={() => setImagePreview(mediaUrl)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"><Maximize2 className="h-4 w-4" /> Full screen</button>}
                                </>
                              )}
                              {mine && msgMediaType === "TEXT" && !msg.deleted && (
                                <button type="button" onClick={() => setEditingMessage({ id: msg.id, content: msg.content || "" })} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"><Pencil className="h-4 w-4" /> Edit</button>
                              )}
                              {mine && (
                                <button type="button" onClick={() => handleDeleteMessage(msg)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#ed4956] hover:bg-secondary"><Trash2 className="h-4 w-4" /> Delete</button>
                              )}
                              {!mine && (
                                <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-secondary opacity-60"><Trash2 className="h-4 w-4" /> Delete</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      )
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
                  onBlock={setBlockTarget}
                  onReport={() => setReportOpen(true)}
                  onDelete={() => setDeleteConfirmOpen(true)}
                  actionMessage={actionMessage}
                  onProfileClick={(userId) => navigate(`/profile/${userId}`)}
                />
              )}
            </div>

            <form onSubmit={handleSend} className="relative border-t border-primary px-4 pb-4 pt-3">
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-primary bg-secondary px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary">
                      Replying to {String(replyingTo.senderId || replyingTo.sender?.id) === String(currentUser?.id) ? "yourself" : replyingTo.senderUsername || replyingTo.sender?.username || selectedThreadName}
                    </p>
                    <p className="truncate text-xs text-secondary">{getMessageSummary(replyingTo)}</p>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="shrink-0 rounded-full p-1 hover:bg-hover" aria-label="Cancel reply">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-primary bg-card px-3 py-2.5">
                <button type="button" onClick={() => setMessageEmojiOpen((prev) => !prev)} className="shrink-0 text-secondary hover:text-secondary">
                  <Smile className="h-5 w-5" />
                </button>
                <button type="button" disabled={uploadingMedia} onClick={() => mediaInputRef.current?.click()} className="shrink-0 text-secondary hover:text-primary disabled:opacity-40" aria-label="Add media">
                  <Image className="h-5 w-5" />
                </button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingMedia}
                  onClick={recording ? stopRecording : startRecording}
                  className={`shrink-0 ${recording ? "text-[#ed4956]" : "text-secondary hover:text-primary"} disabled:opacity-40`}
                  aria-label={recording ? "Stop recording" : "Record voice message"}
                >
                  <Mic className="h-5 w-5" />
                </button>
                {recording && (
                  <span className="shrink-0 text-xs font-semibold text-[#ed4956]">
                    {formatRecordingTime(recordingSeconds)}
                  </span>
                )}
                <textarea
                  value={messageText}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const form = e.currentTarget.closest("form");
                      if (form) form.requestSubmit();
                    }
                  }}
                  placeholder={uploadingMedia ? "Uploading media..." : "Message..."}
                  rows={1}
                  className="flex-1 border-0 bg-transparent text-sm outline-none resize-none py-0.5 max-h-24"
                  style={{ minHeight: "20px" }}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="shrink-0 text-sm font-semibold text-[#0095f6] disabled:opacity-40"
                >
                  Send
                </button>
              </div>
              {messageEmojiOpen && (
                <div ref={messageEmojiRef} className="absolute bottom-16 left-4 z-50" onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMessageText((prev) => prev + emojiData.emoji);
                    }}
                    width={310}
                    height={360}
                    skinTonesDisabled={true}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </form>
          </>
        )}
      </main>

      {reportOpen && (
        <ReportModal onClose={() => setReportOpen(false)} onSubmit={handleReportSubmit} />
      )}
      {muteOpen && (
        <MuteMessagesModal
          onClose={() => setMuteOpen(false)}
          onSelect={handleMuteChoice}
        />
      )}
      {blockTarget && (
        <BlockUserModal
          user={blockTarget}
          onClose={() => setBlockTarget(null)}
          onConfirm={handleBlockMember}
        />
      )}
      {deleteConfirmOpen && (
        <DeleteChatModal
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteChat}
        />
      )}
      {groupCreateOpen && (
        <CreateGroupModal
          currentUserId={currentUser?.id}
          onClose={() => setGroupCreateOpen(false)}
          onCreate={async (group) => {
            setGroups((prev) => [group, ...prev]);
            setActiveInboxTab("groups");
            setGroupCreateOpen(false);
            await openGroup(group);
          }}
        />
      )}
      {groupDetailsOpen && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          currentUserId={currentUser?.id}
          onClose={() => setGroupDetailsOpen(false)}
          onProfileClick={(userId) => navigate(`/profile/${userId}`)}
          onMemberAdded={handleGroupMemberAdded}
        />
      )}
      {pendingMedia && (
        <MediaConfirmModal
          pendingMedia={pendingMedia}
          uploading={uploadingMedia}
          onClose={() => setPendingMedia((prev) => { if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl); return null; })}
          onSend={sendPendingMedia}
        />
      )}
      {imagePreview && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/90 p-4">
          <button type="button" onClick={() => setImagePreview(null)} className="absolute right-5 top-5 text-white" aria-label="Close full screen">
            <X className="h-8 w-8" />
          </button>
          <img src={imagePreview} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
      {nicknamesOpen && (
        <NicknameModal
          details={chatDetails}
          currentUserId={currentUser?.id}
          onClose={() => setNicknamesOpen(false)}
          onSave={async (userId, nickname) => {
            const chatId = selectedChat.id;
            try {
              if (nickname) await updateChatNickname(chatId, userId, nickname);
              else await removeChatNickname(chatId, userId);
              applyOtherUserNickname(chatId, userId, nickname);
            } catch {  }
          }}
        />
      )}
    </div>
  );
}

function ChatDetailsPanel({ details, currentUserId, onClose, onToggleMute, onNicknames, onBlock, onReport, onDelete, actionMessage, onProfileClick }) {
  const otherMembers = (details?.members || []).filter((member) => member.id !== currentUserId);

  return (
    <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-primary bg-card">
      <div className="flex items-center justify-between border-b border-primary p-4">
        <h2 className="font-bold">Details</h2>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-hover" aria-label="Close details">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-1 border-b border-primary p-3">
        <button type="button" onClick={onToggleMute} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary">
          <span className="flex items-center gap-3">{details?.muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />} Mute messages</span>
          <span className={`h-5 w-9 rounded-full ${details?.muted ? "bg-[#0095f6]" : "bg-[#dbdbdb]"}`}>
            <span className={`block h-5 w-5 rounded-full bg-card shadow ${details?.muted ? "translate-x-4" : ""}`} />
          </span>
        </button>
        <button type="button" onClick={onNicknames} className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-semibold hover:bg-secondary">
          Nicknames
        </button>
      </div>
      <div className="border-b border-primary p-4">
        <h3 className="mb-3 text-sm font-bold">Members</h3>
        {(details?.members || []).map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onProfileClick(member.id)}
            className="flex w-full items-center gap-3 rounded-lg py-2 text-left hover:bg-secondary"
          >
            <img src={getAvatarUrl(member)} alt="" className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{member.nickname || member.username}</p>
              <p className="truncate text-xs text-secondary">{member.fullName}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="space-y-1 p-3">
        {otherMembers.map((member) => (
          <button key={member.id} type="button" onClick={() => onBlock(member)} disabled={member.blocked} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#ed4956] hover:bg-[#fff5f5] disabled:opacity-50">
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

function GroupDetailsModal({ group, currentUserId, onClose, onProfileClick, onMemberAdded }) {
  const members = Array.isArray(group.members) ? group.members : [];
  const [addingOpen, setAddingOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b border-primary">
          <h2 className="text-sm font-bold">Group details</h2>
          <button type="button" onClick={onClose} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tertiary">
            <Users className="h-8 w-8 text-secondary" />
          </div>
          <h3 className="mt-3 text-lg font-bold">{group.name}</h3>
          <p className="text-sm text-secondary">{members.length} members</p>
          {group.description && <p className="mt-2 text-sm text-secondary">{group.description}</p>}
        </div>
        <div className="border-t border-primary p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold">Participants</h4>
            <button type="button" onClick={() => setAddingOpen(true)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#0095f6] hover:bg-hover">
              <UserPlus className="h-4 w-4" />
              Add
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onProfileClick(member.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-secondary"
              >
                <img src={getAvatarUrl(member)} alt="" className="h-10 w-10 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{String(member.id) === String(currentUserId) ? "Me" : member.username}</p>
                  <p className="truncate text-xs text-secondary">{member.fullName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {addingOpen && (
        <AddGroupMembersModal
          group={group}
          currentUserId={currentUserId}
          onClose={() => setAddingOpen(false)}
          onAdded={async () => {
            setAddingOpen(false);
            await onMemberAdded?.();
          }}
        />
      )}
    </div>
  );
}

function AddGroupMembersModal({ group, currentUserId, onClose, onAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const members = Array.isArray(group?.members) ? group.members : [];
  const memberIds = useMemo(() => new Set(members.map((member) => String(member.id))), [members]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 1) {
        setResults([]);
        return;
      }
      try {
        const users = await searchUsersForChat(trimmed);
        setResults((Array.isArray(users) ? users : []).filter((user) => String(user.id) !== String(currentUserId) && !memberIds.has(String(user.id))));
      } catch {
        setError("Could not search users. Please try again.");
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, currentUserId, memberIds]);

  const addUser = async (user) => {
    setSavingId(user.id);
    setError("");
    try {
      await addGroupMember(group.id, user.id);
      await onAdded();
    } catch {
      setError("Could not add this participant.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[920] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b border-primary">
          <h2 className="text-sm font-bold">Add participants</h2>
          <button type="button" onClick={onClose} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            className="h-11 w-full rounded-lg border border-primary bg-card px-3 text-sm outline-none"
          />
          {error && <p className="mt-3 text-sm text-[#ed4956]">{error}</p>}
          <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-primary">
            {query.trim().length < 1 ? (
              <p className="p-4 text-sm text-secondary">Search for someone to add.</p>
            ) : results.length === 0 ? (
              <p className="p-4 text-sm text-secondary">No available users found.</p>
            ) : (
              results.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={getAvatarUrl(user)} alt="" className="h-9 w-9 rounded-full object-cover" onError={(e) => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.onerror = null; }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.username}</p>
                      <p className="truncate text-xs text-secondary">{user.fullName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={savingId === user.id}
                    onClick={() => addUser(user)}
                    className="rounded-lg bg-[#0095f6] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {savingId === user.id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaConfirmModal({ pendingMedia, uploading, onClose, onSend }) {
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b border-primary">
          <h2 className="text-sm font-bold">Send media</h2>
          <button type="button" onClick={onClose} disabled={uploading} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex min-h-[280px] items-center justify-center rounded-lg bg-black">
            {pendingMedia.type === "IMAGE" ? (
              <img src={pendingMedia.previewUrl} alt="" className="max-h-[420px] max-w-full object-contain" />
            ) : pendingMedia.type === "VIDEO" ? (
              <video src={pendingMedia.previewUrl} controls className="max-h-[420px] max-w-full" />
            ) : (
              <audio src={pendingMedia.previewUrl} controls className="w-full" />
            )}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={uploading} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={onSend} disabled={uploading} className="rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {uploading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateGroupModal({ currentUserId, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      try {
        const users = await searchUsersForChat(trimmed);
        const selectedIds = new Set(selectedUsers.map((user) => String(user.id)));
        setResults((Array.isArray(users) ? users : []).filter((user) => String(user.id) !== String(currentUserId) && !selectedIds.has(String(user.id))));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedUsers, currentUserId]);

  const addUser = (user) => {
    setSelectedUsers((prev) => [...prev, user]);
    setQuery("");
    setResults([]);
  };

  const submit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || selectedUsers.length === 0) return;
    setSaving(true);
    try {
      const group = await createGroup({
        name: trimmedName,
        description: description.trim(),
        memberIds: selectedUsers.map((user) => user.id),
      });
      await onCreate(group);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b border-primary">
          <h2 className="text-sm font-bold">New group</h2>
          <button type="button" onClick={onClose} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" className="h-11 w-full rounded-lg border border-primary px-3 text-sm outline-none" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="min-h-20 w-full rounded-lg border border-primary p-3 text-sm outline-none" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users to add" className="h-11 w-full rounded-lg border border-primary px-3 text-sm outline-none" />

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <button key={user.id} type="button" onClick={() => setSelectedUsers((prev) => prev.filter((item) => item.id !== user.id))} className="rounded-full bg-tertiary px-3 py-1 text-xs font-semibold">
                  {user.username} ×
                </button>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-primary">
              {results.map((user) => (
                <button key={user.id} type="button" onClick={() => addUser(user)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary">
                  <img src={getAvatarUrl(user)} alt="" className="h-9 w-9 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.username}</p>
                    <p className="truncate text-xs text-secondary">{user.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button type="submit" disabled={saving || !name.trim() || selectedUsers.length === 0} className="h-10 w-full rounded-lg bg-[#0095f6] text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Creating..." : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState("Spam");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const reasons = ["Spam", "Harassment", "Hate speech", "Scam or fraud", "Violence", "Nudity", "Other"];

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
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b border-primary">
          <h2 className="text-sm font-bold">Report</h2>
          <button type="button" onClick={onClose} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-secondary px-5 py-4">
          <h3 className="text-sm font-bold">Why are you reporting this chat?</h3>
        </div>
        <div className="py-1">
          {reasons.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-3 border-b border-secondary px-5 py-3 text-sm">
              <input type="radio" checked={reason === item} onChange={() => setReason(item)} />
              {item}
            </label>
          ))}
        </div>
        <div className="p-4">
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add details" className="min-h-20 w-full rounded-lg border border-primary p-3 text-sm outline-none" />
          <button type="submit" disabled={saving} className="mt-3 h-10 w-full rounded-lg bg-[#ed4956] text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NicknameModal({ details, currentUserId, onClose, onSave }) {
  const editableMembers = currentUserId == null
    ? []
    : (details?.members || []).filter((member) => String(member.id) !== String(currentUserId));
  const [values, setValues] = useState(() => {
    const entries = {};
    editableMembers.forEach((member) => {
      entries[member.id] = member.nickname || "";
    });
    return entries;
  });
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const saveNickname = async (memberId) => {
    setSavingId(memberId);
    await onSave(memberId, values[memberId]?.trim());
    setSavingId(null);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b border-primary">
          <h2 className="text-sm font-bold">Nicknames</h2>
          <button type="button" onClick={onClose} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {editableMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 border-b border-secondary py-3 last:border-b-0">
              <img src={getAvatarUrl(member)} alt="" className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{member.username}</p>
                <p className="truncate text-xs text-secondary">{member.fullName}</p>
                {editingId === member.id ? (
                  <input
                    value={values[member.id] || ""}
                    onChange={(event) => setValues((prev) => ({ ...prev, [member.id]: event.target.value }))}
                    placeholder={member.username}
                    className="mt-2 h-9 w-full rounded-lg border border-primary px-3 text-sm outline-none"
                    autoFocus
                  />
                ) : (
                  <p className="mt-1 text-sm text-secondary">{values[member.id] || "No nickname"}</p>
                )}
              </div>
              {editingId === member.id ? (
                <button type="button" disabled={savingId === member.id} onClick={() => saveNickname(member.id)} className="rounded-lg bg-[#0095f6] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                  Save
                </button>
              ) : (
                <button type="button" onClick={() => setEditingId(member.id)} className="rounded-full p-2 hover:bg-hover" aria-label={`Edit ${member.username} nickname`}>
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MuteMessagesModal({ onClose, onSelect }) {
  const options = [
    ["For 1 hour", 1],
    ["For 8 hours", 8],
    ["For 24 hours", 24],
    ["Until I change it", null],
  ];

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-card text-center">
        <h2 className="border-b border-primary py-4 text-sm font-bold">Mute messages</h2>
        {options.map(([label, hours]) => (
          <button key={label} type="button" onClick={() => onSelect(hours)} className="block w-full border-b border-secondary py-4 text-sm hover:bg-secondary">
            {label}
          </button>
        ))}
        <button type="button" onClick={onClose} className="block w-full py-4 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function BlockUserModal({ user, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-card text-center">
        <div className="p-6">
          <h2 className="text-lg font-bold">Block {user?.username}?</h2>
          <p className="mt-3 text-sm leading-5 text-secondary">
            They won't be able to find your profile, posts or story on Instagram. Instagram won't let them know you blocked them.
          </p>
        </div>
        <button type="button" onClick={onConfirm} className="block w-full border-t border-primary py-4 text-sm font-bold text-[#ed4956]">
          Block
        </button>
        <button type="button" onClick={onClose} className="block w-full border-t border-primary py-4 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeleteChatModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-card text-center">
        <div className="p-6">
          <h2 className="text-lg font-bold">Delete chat from inbox?</h2>
          <p className="mt-3 text-sm leading-5 text-secondary">
            This will remove the chat from your inbox and erase the chat history. To stop receiving new messages from this account, first block the account then delete the chat.
          </p>
        </div>
        <button type="button" onClick={onConfirm} className="block w-full border-t border-primary py-4 text-sm font-bold text-[#ed4956]">
          Delete
        </button>
        <button type="button" onClick={onClose} className="block w-full border-t border-primary py-4 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

const extractSharedPath = (msg, fallback = "") => {
  const source = [msg?.mediaUrl, msg?.content, fallback].filter(Boolean).join(" ");
  const postMatch = source.match(/\/post\/(\d+)/);
  if (postMatch?.[1]) return `/post/${postMatch[1]}`;

  return "";
};

const formatSharedMessageContent = (msg, messageType) => {
  const fallback = `Shared a ${String(messageType || "post").toLowerCase()}`;
  return String(msg?.content || fallback).replace(/\s+\/(?:post|stories)\/\d+\s*$/, "") || fallback;
};

const formatLastMessage = (message = "") =>
  String(message).replace(/\s+\/(?:post|stories)\/\d+\s*$/, "");

const isVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(String(url));

export default Messages;
