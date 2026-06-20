import axios from "axios";
import { API_BASE_URL } from "./config";

const POSTS_API_URL = `${API_BASE_URL}/posts`;

export const likePost = async (postId, userId) => {
  const { data } = await axios.post(`${POSTS_API_URL}/${postId}/like`, null, {
    params: { userId },
  });
  return data;
};

export const unlikePost = async (postId, userId) => {
  const { data } = await axios.delete(`${POSTS_API_URL}/${postId}/like`, {
    params: { userId },
  });
  return data;
};

export const getLikeCount = async (postId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/likes`);
  return data;
};

export const isPostLiked = async (postId, userId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/like/status`, {
    params: { userId },
  });
  return data;
};