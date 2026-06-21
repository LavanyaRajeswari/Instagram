import axios from "axios";
import { API_BASE_URL } from "./config";

const POSTS_API_URL = `${API_BASE_URL}/posts`;

export const getComments = async (postId, userId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/comments`, {
    params: userId ? { userId } : {},
  });
  return data;
};

export const addComment = async (postId, userId, text) => {
  const { data } = await axios.post(`${POSTS_API_URL}/${postId}/comments`, null, {
    params: { userId, text },
  });
  return data;
};

export const addReply = async (postId, parentCommentId, userId, text) => {
  const { data } = await axios.post(
    `${POSTS_API_URL}/${postId}/comments/${parentCommentId}/replies`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const deleteComment = async (postId, commentId, userId) => {
  await axios.delete(`${POSTS_API_URL}/${postId}/comments/${commentId}`, {
    params: { userId },
  });
  return true;
};

export const likeComment = async (commentId, userId) => {
  const { data } = await axios.post(`${POSTS_API_URL}/comments/${commentId}/like`, null, {
    params: { userId },
  });
  return data;
};

export const unlikeComment = async (commentId, userId) => {
  const { data } = await axios.delete(`${POSTS_API_URL}/comments/${commentId}/like`, {
    params: { userId },
  });
  return data;
};

export const getCommentCount = async (postId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/comments/count`);
  return data;
};
