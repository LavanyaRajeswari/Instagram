import { api, unwrapPage } from "./client";

const POSTS = "/posts";

export const getPosts = async (...args) => {
  const maybeUserId = args[0];
  const params = typeof maybeUserId === "object" ? maybeUserId : {};
  if (maybeUserId && typeof maybeUserId !== "object") {
    const { data } = await api.get(`${POSTS}/user/${maybeUserId}`, { params });
    return unwrapPage(data);
  }
  const { data } = await api.get(POSTS, { params });
  return unwrapPage(data);
};

export const getFeedPosts = async ({ page = 0, size = 10 } = {}) => {
  const { data } = await api.get(`${POSTS}/feed`, { params: { page, size } });
  return unwrapPage(data);
};

export const getPostById = async (id) => {
  const { data } = await api.get(`${POSTS}/${id}`);
  return data;
};

export const createPost = async ({ caption, images = [], musicId }) => {
  const formData = new FormData();
  formData.append("caption", caption || "");
  if (musicId) formData.append("musicId", musicId);
  images.forEach((image) => formData.append("images", image));
  const { data } = await api.post(POSTS, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const repostPost = async (postId) => {
  const { data } = await api.post(`${POSTS}/${postId}/repost`);
  return data;
};

export const updatePost = async ({ postId, caption, images = [], musicId }) => {
  const formData = new FormData();
  formData.append("caption", caption || "");
  if (musicId) formData.append("musicId", musicId);
  images.forEach((image) => formData.append("images", image));
  const { data } = await api.put(`${POSTS}/${postId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deletePost = async (postId) => {
  await api.delete(`${POSTS}/${postId}`);
  return true;
};

export const getExplorePosts = async ({ page = 0, size = 20 } = {}) => {
  const { data } = await api.get(`${POSTS}/explore`, { params: { page, size } });
  return unwrapPage(data);
};

export const searchPosts = async (query) => {
  const { data } = await api.get(`${POSTS}/search`, { params: { query } });
  return unwrapPage(data);
};
