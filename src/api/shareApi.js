import { api } from "./client";
const POSTS = "/posts";

export const sharePost = async ({ postId, receiverId = null, shareType = "COPY_LINK" }) => {
  const params = { shareType };
  if (receiverId) params.receiverId = receiverId;
  const { data } = await api.post(`${POSTS}/${postId}/share`, null, { params });
  return data;
};
export const getShareCount = async (postId) => {
  const { data } = await api.get(`${POSTS}/${postId}/shares`);
  return typeof data === "number" ? data : data?.count ?? data?.shareCount ?? 0;
};
