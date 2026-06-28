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
  const { data } = await api.get("/settings/story-hide-from");
  return Array.isArray(data) ? data : [];
};

export const addHiddenStoryUser = async (userId) => {
  await api.post(`/settings/story-hide-from/${userId}`);
};

export const removeHiddenStoryUser = async (userId) => {
  await api.delete(`/settings/story-hide-from/${userId}`);
};

export const getSettings = async () => {
  const { data } = await api.get("/settings");
  return data;
};

export const getMessagePrivacySettings = async () => {
  const { data } = await api.get("/settings");
  return {
    storyRepliesEnabled: data?.storyRepliesEnabled ?? true,
    storyMentionsEnabled: data?.storyMentionsEnabled ?? true,
  };
};

export const updateMessagePrivacySettings = async (settings) => {
  const tasks = [];
  if (settings.storyRepliesEnabled !== undefined) {
    tasks.push(api.put("/settings/story-replies", null, { params: { value: settings.storyRepliesEnabled } }));
  }
  if (settings.storyMentionsEnabled !== undefined) {
    tasks.push(api.put("/settings/story-mentions", null, { params: { value: settings.storyMentionsEnabled } }));
  }
  await Promise.all(tasks);
  return settings;
};

export const getNotificationSettings = async () => {
  const { data } = await api.get("/settings/notifications");
  return data;
};

export const updateNotificationSettings = async (updates) => {
  const { data } = await api.put("/settings/notifications", updates);
  return data;
};

export const updatePrivacySetting = async (setting, value) => {
  await api.put(`/users/privacy/${setting}`, null, { params: { value } });
};

export const updateStoryMentions = async (value) => {
  await api.put("/settings/story-mentions", null, { params: { value } });
};

export const updateStoryReplies = async (value) => {
  await api.put("/settings/story-replies", null, { params: { value } });
};

export const updateSensitiveContent = async (value) => {
  await api.put("/settings/sensitive-content", null, { params: { value } });
};

export const updateReelDownloads = async (value) => {
  await api.put("/settings/reel-downloads", null, { params: { value } });
};

export const getLoginHistory = async () => {
  const { data } = await api.get("/users/login-history");
  return Array.isArray(data) ? data : [];
};

export const getRestrictedAccounts = async () => {
  const { data } = await api.get("/users/restricted");
  return Array.isArray(data) ? data : [];
};

export const restrictUser = async (userId) => {
  await api.post(`/users/${userId}/restrict`);
};

export const unRestrictUser = async (userId) => {
  await api.delete(`/users/${userId}/restrict`);
};

export const setTheme = async (value) => {
  await api.put("/settings/theme", null, { params: { value } });
};

export const getActivity = async () => {
  const { data } = await api.get("/settings/activity");
  return Array.isArray(data) ? data : [];
};
