import { api } from "./client";

export const sharePost = async ({ postId, receiverId = null, shareType = "COPY_LINK" }) => {
  const params = { shareType };
  if (receiverId) params.receiverId = receiverId;
  const { data } = await api.post(`/posts/${postId}/share`, null, { params });
  return data;
};
export const getShareCount = async (postId) => {
  const { data } = await api.get(`/posts/${postId}/shares`);
  return typeof data === "number" ? data : data?.count ?? data?.shareCount ?? 0;
};
export const shareStory = async ({ storyId, receiverId = null, shareType = "COPY_LINK" }) => {
  const params = { shareType };
  if (receiverId) params.receiverId = receiverId;
  const { data } = await api.post(`/stories/${storyId}/share`, null, { params });
  return data;
};
export const getStoryShareCount = async (storyId) => {
  const { data } = await api.get(`/stories/${storyId}/shares`);
  return typeof data === "number" ? data : data?.count ?? data?.shareCount ?? 0;
};
