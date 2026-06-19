import axios from "axios";
import { API_BASE_URL } from "./config";

const POSTS_API_URL = `${API_BASE_URL}/posts`;

export const getComments = async (postId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/comments`);
  return data;
};

export const addComment = async (postId, userId, text) => {
  const { data } = await axios.post(
    `${POSTS_API_URL}/${postId}/comments`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const updateComment = async (commentId, userId, text) => {
  const { data } = await axios.put(
    `${POSTS_API_URL}/comments/${commentId}`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const deleteComment = async (commentId) => {
  await axios.delete(`${POSTS_API_URL}/comments/${commentId}`);
  return true;
};