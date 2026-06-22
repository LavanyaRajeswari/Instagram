import { api, unwrapPage } from "./client";
const POSTS = "/posts";

export const savePost = async (postId) => {
  const { data } = await api.post(`${POSTS}/${postId}/save`);
  return data;
};
export const unsavePost = async (postId) => {
  const { data } = await api.delete(`${POSTS}/${postId}/save`);
  return data;
};
export const isPostSaved = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/save/status`);
  return typeof data === "boolean" ? data : Boolean(data?.saved ?? data?.status);
};
export const getSavedPosts = async () => {
  const { data } = await api.get(`${POSTS}/saved`);
  return unwrapPage(data);
};
