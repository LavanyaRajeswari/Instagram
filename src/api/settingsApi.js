import { api } from "./client";

export const getCloseFriends = async () => {
  const { data } = await api.get("/close-friends");
  return Array.isArray(data) ? data : [];
};

export const addCloseFriend = async (friendId) => {
  await api.post("/close-friends", { friendId });
};

export const removeCloseFriend = async (friendId) => {
  await api.delete(`/close-friends/${friendId}`);
};

export const getBlockedAccounts = async () => {
  const { data } = await api.get("/users/blocked");
  return Array.isArray(data) ? data : [];
};

export const blockUser = async (userId) => {
  await api.post(`/users/${userId}/block`);
};

export const unblockUser = async (userId) => {
  await api.delete(`/users/${userId}/block`);
};

export const getHiddenStoryUsers = async () => {
  const { data } = await api.get("/settings/story/hidden-users");
  return Array.isArray(data) ? data : [];
};

export const addHiddenStoryUser = async (userId) => {
  await api.post(`/settings/story/hidden-users/${userId}`);
};

export const removeHiddenStoryUser = async (userId) => {
  await api.delete(`/settings/story/hidden-users/${userId}`);
};

export const getMessagePrivacySettings = async () => {
  const { data } = await api.get("/settings/messages");
  return data;
};

export const updateMessagePrivacySettings = async (settings) => {
  const { data } = await api.put("/settings/messages", settings);
  return data;
};
