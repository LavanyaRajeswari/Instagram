import { api, unwrapPage } from "./client";

export const getTaggedPosts = async (userId) => {
  const { data } = await api.get(`/tags/user/${userId}`);
  return unwrapPage(data);
};
