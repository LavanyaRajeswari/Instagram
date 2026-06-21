import axios from "axios";
import { API_BASE_URL } from "./config";

const POSTS_API_URL = `${API_BASE_URL}/posts`;

export const getPosts = async (userId) => {
  const response = await axios.get(POSTS_API_URL, {
    params: userId ? { userId } : {},
  });
  return response.data;
};

export const getPostById = async (id) => {
  const response = await axios.get(`${POSTS_API_URL}/${id}`);
  return response.data;
};

export const createPost = async ({ userId, caption, images = [] }) => {
  const formData = new FormData();

  formData.append("userId", userId);
  formData.append("caption", caption || "");

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.post(POSTS_API_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updatePost = async ({ postId, caption, images = [] }) => {
  const formData = new FormData();

  formData.append("caption", caption || "");

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.put(`${POSTS_API_URL}/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deletePost = async (postId) => {
  const id = String(postId ?? "").trim();
  if (!id) {
    throw new Error("Post id is required");
  }

  await axios.delete(`${POSTS_API_URL}/${encodeURIComponent(id)}`);
  return true;
};
