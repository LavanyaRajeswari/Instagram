import { api, unwrapPage } from "./client";

export const getHashtagPosts = async (tag, { page = 0, size = 20 } = {}) => {
  const normalizedTag = String(tag || "").trim().replace(/^#/, "").toLowerCase();
  const { data } = await api.get(`/hashtags/${encodeURIComponent(normalizedTag)}/posts`, {
    params: { page, size },
  });
  return unwrapPage(data);
};

export const getHashtagCount = async (tag) => {
  const normalizedTag = String(tag || "").trim().replace(/^#/, "").toLowerCase();
  const { data } = await api.get(`/hashtags/${encodeURIComponent(normalizedTag)}/count`);
  return typeof data === "number" ? data : data?.count ?? 0;
};

export const getTrendingHashtags = async (limit = 10) => {
  const { data } = await api.get("/hashtags/trending", { params: { limit } });
  return Array.isArray(data) ? data : [];
};

export const searchHashtags = async (q) => {
  const normalizedQ = String(q || "").trim().replace(/^#/, "").toLowerCase();
  const { data } = await api.get("/hashtags/search", { params: { query: normalizedQ } });
  return Array.isArray(data) ? data : [];
};
