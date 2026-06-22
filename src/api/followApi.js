import { api } from "./client";
const USERS = "/users";

export const followUser = async (followingId) => {
  const { data } = await api.post(`${USERS}/${followingId}/follow`);
  return data;
};
export const unfollowUser = async (followingId) => {
  const { data } = await api.delete(`${USERS}/${followingId}/follow`);
  return data;
};
export const isFollowingUser = async (followingId) => {
  const { data } = await api.get(`${USERS}/${followingId}/follow/status`);
  return typeof data === "boolean" ? data : Boolean(data?.following ?? data?.status);
};
export const getFollowersCount = async (userId) => {
  const { data } = await api.get(`${USERS}/${userId}/followers/count`);
  return typeof data === "number" ? data : data?.count ?? data?.followersCount ?? 0;
};
export const getFollowingCount = async (userId) => {
  const { data } = await api.get(`${USERS}/${userId}/following/count`);
  return typeof data === "number" ? data : data?.count ?? data?.followingCount ?? 0;
};
export const getFollowers = async (userId) => {
  const { data } = await api.get(`${USERS}/${userId}/followers`);
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
};
export const getFollowing = async (userId) => {
  const { data } = await api.get(`${USERS}/${userId}/following`);
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
};
