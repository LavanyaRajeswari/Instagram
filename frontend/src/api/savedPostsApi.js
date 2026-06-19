import axios from "axios";
import { API_BASE_URL } from "./config";

const POSTS_API_URL = `${API_BASE_URL}/posts`;

export const savePost = async (postId, userId) => {
  const { data } = await axios.post(`${POSTS_API_URL}/${postId}/save`, null, {
    params: { userId },
  });
  return data;
};

export const unsavePost = async (postId, userId) => {
  const { data } = await axios.delete(`${POSTS_API_URL}/${postId}/save`, {
    params: { userId },
  });
  return data;
};

export const isPostSaved = async (postId, userId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/save/status`, {
    params: { userId },
  });
  return data;
};

export const getSavedPosts = async (userId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/saved`, {
    params: { userId },
  });
  return data;
};