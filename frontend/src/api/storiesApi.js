import axios from "axios";
import { API_BASE_URL } from "./config";

const STORIES_API_URL = `${API_BASE_URL}/stories`;

export const getStories = async () => {
  const response = await axios.get(STORIES_API_URL);
  return response.data;
};

export const createStory = async ({ userId, caption, media }) => {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("caption", caption || "");
  formData.append("media", media);

  const response = await axios.post(STORIES_API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const likeStory = async (storyId, userId) => {
  const response = await axios.post(`${STORIES_API_URL}/${storyId}/like`, null, {
    params: { userId },
  });
  return response.data;
};

export const unlikeStory = async (storyId, userId) => {
  const response = await axios.delete(`${STORIES_API_URL}/${storyId}/like`, {
    params: { userId },
  });
  return response.data;
};

export const isStoryLiked = async (storyId, userId) => {
  const response = await axios.get(`${STORIES_API_URL}/${storyId}/liked`, {
    params: { userId },
  });
  return response.data;
};

export const getStoryLikeCount = async (storyId) => {
  const response = await axios.get(`${STORIES_API_URL}/${storyId}/likes`);
  return response.data;
};

export const replyToStory = async (storyId, userId, text) => {
  const response = await axios.post(`${STORIES_API_URL}/${storyId}/reply`, null, {
    params: { userId, text },
  });
  return response.data;
};

export const getStoryReplies = async (storyId) => {
  const response = await axios.get(`${STORIES_API_URL}/${storyId}/replies`);
  return response.data;
};

export const deleteStory = async (storyId, userId) => {
  const response = await axios.delete(`${STORIES_API_URL}/${storyId}`, {
    params: { userId },
  });
  return response.data;
};