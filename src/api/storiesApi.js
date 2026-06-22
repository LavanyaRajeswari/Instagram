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
