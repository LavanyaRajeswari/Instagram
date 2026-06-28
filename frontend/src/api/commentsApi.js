import { api, unwrapPage } from "./client";
const POSTS = "/posts";

export const getComments = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/comments`);
  return unwrapPage(data);
};
export const addComment = async (postId, text) => {
  const { data } = await api.post(`${POSTS}/${postId}/comments`, { text });
  return data;
};
export const addReply = async (postId, parentCommentId, text) => {
  const { data } = await api.post(`${POSTS}/${postId}/comments/${parentCommentId}/replies`, { text });
  return data;
};
export const deleteComment = async (postId, commentId) => {
  await api.delete(`${POSTS}/${postId}/comments/${commentId}`);
  return true;
};
export const likeComment = async (commentId) => {
  const { data } = await api.post(`${POSTS}/comments/${commentId}/like`);
  return data;
};
export const unlikeComment = async (commentId) => {
  const { data } = await api.delete(`${POSTS}/comments/${commentId}/like`);
  return data;
};
export const getCommentCount = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/comments/count`);
  return typeof data === "number" ? data : data?.count ?? data?.commentCount ?? 0;
};
