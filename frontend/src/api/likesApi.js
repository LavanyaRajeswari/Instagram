import { api } from "./client";
const POSTS = "/posts";

export const likePost = async (postId) => {
  const { data } = await api.post(`${POSTS}/${postId}/like`);
  return data;
};
export const unlikePost = async (postId) => {
  const { data } = await api.delete(`${POSTS}/${postId}/like`);
  return data;
};
export const getLikeCount = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/likes`);
  return typeof data === "number" ? data : data?.count ?? data?.likeCount ?? 0;
};
export const getPostLikeUsers = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/likes/users`);
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
};
export const isPostLiked = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/like/status`);
  return typeof data === "boolean" ? data : Boolean(data?.liked ?? data?.status);
};
