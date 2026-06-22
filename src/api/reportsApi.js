import { api } from "./config";

export const reportUser = async (userId, payload) => {
  const { data } = await api.post(`/reports/user/${userId}`, payload);
  return data;
};

export const reportChat = async (chatId, payload) => {
  const { data } = await api.post(`/reports/chat/${chatId}`, payload);
  return data;
};

export const reportMessage = async (messageId, payload) => {
  const { data } = await api.post(`/reports/message/${messageId}`, payload);
  return data;
};
