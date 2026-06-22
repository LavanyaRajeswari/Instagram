import { api, unwrapPage } from "./config";

export const getChats = async () => {
  const { data } = await api.get("/chats");
  return data;
};

export const getMessages = async (chatId, { page = 0, size = 30 } = {}) => {
  const { data } = await api.get(`/messages/${chatId}`, {
    params: { page, size },
  });
  return unwrapPage(data);
};

export const sendMessage = async ({ chatId, content }) => {
  const { data } = await api.post("/messages", { chatId, content });
  return data;
};

export const markMessagesSeen = async (chatId) => {
  const { data } = await api.put(`/messages/${chatId}/seen`);
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

export const getChatDetails = async (chatId) => {
  const { data } = await api.get(`/chats/${chatId}/details`);
  return data;
};

export const muteChat = async (chatId) => {
  const { data } = await api.put(`/chats/${chatId}/mute`);
  return data;
};

export const unmuteChat = async (chatId) => {
  const { data } = await api.put(`/chats/${chatId}/unmute`);
  return data;
};

export const updateChatNickname = async (chatId, userId, nickname) => {
  const { data } = await api.put(`/chats/${chatId}/members/${userId}/nickname`, { nickname });
  return data;
};

export const removeChatNickname = async (chatId, userId) => {
  const { data } = await api.delete(`/chats/${chatId}/members/${userId}/nickname`);
  return data;
};

export const deleteChat = async (chatId) => {
  await api.delete(`/chats/${chatId}`);
};

export const startAudioCall = async (chatId) => {
  const { data } = await api.post(`/chats/${chatId}/calls/audio`);
  return data;
};

export const startVideoCall = async (chatId) => {
  const { data } = await api.post(`/chats/${chatId}/calls/video`);
  return data;
};

export const getChatCalls = async (chatId) => {
  const { data } = await api.get(`/chats/${chatId}/calls`);
  return data;
};
