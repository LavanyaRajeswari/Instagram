import axios from "axios";
import { API_BASE_URL } from "./config";

const USERS_API_URL = `${API_BASE_URL}/users`;

export const followUser = async (followingId, followerId) => {
  const { data } = await axios.post(
    `${USERS_API_URL}/${followingId}/follow`,
    null,
    { params: { followerId } }
  );

  return data;
};

export const unfollowUser = async (followingId, followerId) => {
  const { data } = await axios.delete(
    `${USERS_API_URL}/${followingId}/follow`,
    { params: { followerId } }
  );

  return data;
};

export const isFollowingUser = async (followingId, followerId) => {
  const { data } = await axios.get(
    `${USERS_API_URL}/${followingId}/follow/status`,
    { params: { followerId } }
  );

  return data;
};

export const getFollowersCount = async (userId) => {
  const { data } = await axios.get(`${USERS_API_URL}/${userId}/followers/count`);
  return data;
};

export const getFollowingCount = async (userId) => {
  const { data } = await axios.get(`${USERS_API_URL}/${userId}/following/count`);
  return data;
};