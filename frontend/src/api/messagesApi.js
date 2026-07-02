import { api, unwrapPage } from "./client";

export const getChats = async () => {
  const { data } = await api.get("/chats");
  return data;
};

export const getUnreadMessageCount = async () => {
  const { data } = await api.get("/chats/unread-count");
  return data?.count ?? 0;
};

export const getMessages = async (chatId, { page = 0, size = 30 } = {}) => {
  const { data } = await api.get(`/messages/${chatId}`, {
    params: { page, size },
  });
  return unwrapPage(data);
};

export const sendMessage = async ({ chatId, content, messageType, mediaUrl, mediaType, replyToId, forwarded, forwardedFromId }) => {
  const body = { chatId, content };
  if (messageType) body.messageType = messageType;
  if (mediaUrl) body.mediaUrl = mediaUrl;
  if (mediaType) body.mediaType = mediaType;
  if (replyToId) body.replyToId = replyToId;
  if (forwarded) body.forwarded = forwarded;
  if (forwardedFromId) body.forwardedFromId = forwardedFromId;
  const { data } = await api.post("/messages", body);
  return data;
};

export const uploadMessageMedia = async (file) => {
  const formData = new FormData();
  formData.append("media", file);
  const { data } = await api.post("/messages/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const markMessagesSeen = async (chatId) => {
  const { data } = await api.put(`/messages/${chatId}/seen`);
  return data;
};

export const editMessage = async (messageId, content) => {
  const { data } = await api.put(`/messages/${messageId}`, { content });
  return data;
};

export const deleteMessageById = async (messageId) => {
  await api.delete(`/messages/${messageId}`);
  return true;
};

export const reactToMessage = async (messageId, emoji) => {
  const { data } = await api.post(`/messages/${messageId}/reaction`, { emoji });
  return data;
};

export const searchUsersForChat = async (query) => {
  const { data } = await api.get("/users/search", {
    params: { query },
  });
  return data;
};

export const startChat = async (userId) => {
  const { data } = await api.post(`/chats/start/${userId}`);
  return data;
};

export const muteChat = async (chatId) => {
  const { data } = await api.put(`/chats/${chatId}/mute`, {});
  return data;
};

export const muteChatUntil = async (chatId, muteUntil) => {
  const body = muteUntil ? { muteUntil } : {};
  const { data } = await api.put(`/chats/${chatId}/mute`, body);
  return data;
};

export const unmuteChat = async (chatId) => {
  const { data } = await api.delete(`/chats/${chatId}/mute`);
  return data;
};

export const updateChatNickname = async (chatId, userId, nickname) => {
  const { data } = await api.put(`/chats/${chatId}/nickname`, { nickname });
  return data;
};

export const removeChatNickname = async (chatId, userId) => {
  const { data } = await api.put(`/chats/${chatId}/nickname`, { nickname: "" });
  return data;
};

export const deleteChat = async (chatId) => {
  await api.delete(`/chats/${chatId}`);
};

export const getGroups = async () => {
  const { data } = await api.get("/groups");
  return Array.isArray(data) ? data : [];
};

export const getGroup = async (groupId) => {
  const { data } = await api.get(`/groups/${groupId}`);
  return data;
};

export const createGroup = async ({ name, description = "", memberIds = [] }) => {
  const { data } = await api.post("/groups", { name, description, memberIds });
  return data;
};

export const addGroupMember = async (groupId, userId) => {
  await api.post(`/groups/${groupId}/members/${userId}`);
};

export const getGroupMessages = async (groupId, { page = 0, size = 30 } = {}) => {
  const { data } = await api.get(`/groups/${groupId}/messages`, {
    params: { page, size },
  });
  return unwrapPage(data);
};

export const sendGroupMessage = async ({ groupId, content, messageType, mediaUrl, mediaType, replyToId }) => {
  const body = { content };
  if (messageType) body.messageType = messageType;
  if (mediaUrl) body.mediaUrl = mediaUrl;
  if (mediaType) body.mediaType = mediaType;
  if (replyToId) body.replyToId = replyToId;
  const { data } = await api.post(`/groups/${groupId}/messages`, body);
  return data;
};

export const editGroupMessage = async (groupId, messageId, content) => {
  const { data } = await api.put(`/groups/${groupId}/messages/${messageId}`, { content });
  return data;
};

export const deleteGroupMessage = async (groupId, messageId) => {
  const { data } = await api.delete(`/groups/${groupId}/messages/${messageId}`);
  return data;
};

export const reactToGroupMessage = async (groupId, messageId, emoji) => {
  const { data } = await api.post(`/groups/${groupId}/messages/${messageId}/reaction`, { emoji });
  return data;
};

export const leaveGroup = async (groupId) => {
  await api.post(`/groups/${groupId}/leave`);
};

export const markGroupMessagesSeen = async (groupId) => {
  await api.post(`/groups/${groupId}/seen`);
};
