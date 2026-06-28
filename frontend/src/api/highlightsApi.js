import { api } from "./client";

export const getUserHighlights = async (userId) => {
  const { data } = await api.get(`/highlights/user/${userId}`);
  return Array.isArray(data) ? data : [];
};

export const getHighlightStories = async (highlightId) => {
  const { data } = await api.get(`/highlights/${highlightId}/stories`);
  return Array.isArray(data) ? data : [];
};

export const createHighlight = async ({ title, storyIds, coverUrl }) => {
  const params = new URLSearchParams();
  params.append("title", title);
  storyIds.forEach((storyId) => params.append("storyIds", storyId));
  if (coverUrl) params.append("coverUrl", coverUrl);
  const { data } = await api.post(`/highlights?${params.toString()}`);
  return data;
};

export const updateHighlight = async ({ id, title, storyIds, coverUrl }) => {
  const params = new URLSearchParams();
  if (title) params.append("title", title);
  if (Array.isArray(storyIds)) storyIds.forEach((storyId) => params.append("storyIds", storyId));
  if (coverUrl) params.append("coverUrl", coverUrl);
  const { data } = await api.put(`/highlights/${id}?${params.toString()}`);
  return data;
};

export const deleteHighlight = async (id) => {
  await api.delete(`/highlights/${id}`);
};
