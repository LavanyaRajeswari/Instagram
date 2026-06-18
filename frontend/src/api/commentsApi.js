import axios from "axios";
import { API_BASE_URL } from "./config";

export const getComments = async (postId) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/posts/${postId}/comments`
  );
  return data;
};

export const addComment = async (postId, userId, text) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/api/posts/${postId}/comments`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const updateComment = async (commentId, userId, text) => {
  const { data } = await axios.put(
    `${API_BASE_URL}/api/posts/comments/${commentId}`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const deleteComment = async (commentId) => {
  await axios.delete(
    `${API_BASE_URL}/api/posts/comments/${commentId}`
  );
  return true;
};