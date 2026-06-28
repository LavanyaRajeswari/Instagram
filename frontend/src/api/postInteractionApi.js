import { api } from "./client";

export const disableComments = async (postId) => {
  const { data } = await api.put(`/posts/${postId}/comments/disable`);
  return data;
};

export const enableComments = async (postId) => {
  const { data } = await api.put(`/posts/${postId}/comments/enable`);
  return data;
};

export const hideLikeCount = async (postId) => {
  const { data } = await api.put(`/posts/${postId}/hide-likes`);
  return data;
};

export const showLikeCount = async (postId) => {
  const { data } = await api.put(`/posts/${postId}/show-likes`);
  return data;
};
