import { api, unwrapPage } from "./client";
const STORIES = "/stories";

export const getStories = async () => {
  const { data } = await api.get(STORIES);
  return unwrapPage(data);
};
export const createStory = async ({ caption, media }) => {
  const formData = new FormData();
  formData.append("caption", caption || "");
  formData.append("media", media);
  const { data } = await api.post(STORIES, formData, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
};
export const setStoryMusic = async (storyId, musicId) => {
  const { data } = await api.put(`${STORIES}/${storyId}/music`, null, { params: { musicId } });
  return data;
};
export const getStoryMusic = async () => {
  const { data } = await api.get("/story-music/trending");
  return Array.isArray(data) ? data : [];
};
export const likeStory = async (storyId) => {
  const { data } = await api.post(`${STORIES}/${storyId}/like`);
  return data;
};
export const unlikeStory = async (storyId) => {
  const { data } = await api.delete(`${STORIES}/${storyId}/like`);
  return data;
};
export const isStoryLiked = async (storyId) => {
  const { data } = await api.get(`${STORIES}/${storyId}/liked`);
  return typeof data === "boolean" ? data : Boolean(data?.liked ?? data?.status);
};
export const getStoryLikeCount = async (storyId) => {
  const { data } = await api.get(`${STORIES}/${storyId}/likes`);
  return typeof data === "number" ? data : data?.count ?? 0;
};
export const replyToStory = async (storyId, _ignoredUserId, text) => {
  const { data } = await api.post(`${STORIES}/${storyId}/reply`, null, { params: { text } });
  return data;
};
export const getStoryReplies = async (storyId) => {
  const { data } = await api.get(`${STORIES}/${storyId}/replies`);
  return unwrapPage(data);
};
export const deleteStory = async (storyId) => {
  const { data } = await api.delete(`${STORIES}/${storyId}`);
  return data;
};
export const trackStoryView = async (storyId) => {
  const { data } = await api.post(`${STORIES}/${storyId}/view`);
  return data;
};
export const getStoryViewCount = async (storyId) => {
  const { data } = await api.get(`${STORIES}/${storyId}/views/count`);
  return typeof data === "number" ? data : data?.count ?? 0;
};
export const getStoryViewers = async (storyId) => {
  const { data } = await api.get(`${STORIES}/${storyId}/viewers`);
  return Array.isArray(data) ? data : [];
};
export const getStoryLikesUsers = async (storyId) => {
  const { data } = await api.get(`${STORIES}/${storyId}/likes/users`);
  return Array.isArray(data) ? data : [];
};
export const saveStory = async (storyId) => {
  const { data } = await api.post(`${STORIES}/${storyId}/save`);
  return data;
};
export const unsaveStory = async (storyId) => {
  const { data } = await api.delete(`${STORIES}/${storyId}/save`);
  return data;
};
export const getSavedStories = async () => {
  const { data } = await api.get(`${STORIES}/saved`);
  return unwrapPage(data);
};
export const archiveStory = async (storyId) => {
  const { data } = await api.post(`${STORIES}/${storyId}/archive`);
  return data;
};
export const getArchivedStories = async () => {
  const { data } = await api.get(`${STORIES}/archived`);
  return unwrapPage(data);
};
export const deleteArchivedStory = async (archiveId) => {
  await api.delete(`${STORIES}/archived/${archiveId}`);
};
export const restoreArchivedStory = async (archiveId) => {
  const { data } = await api.post(`${STORIES}/archived/${archiveId}/restore`);
  return data;
};
