import { api, clearAuthToken, getAuthToken, getRefreshToken, normalizeAuthResponse, setAuthToken, setRefreshToken } from "./client";

const USERS = "/users";
const AUTH = "/auth";

export const loginUser = async (payload) => {
  const { data } = await api.post(`${AUTH}/login`, payload);
  return normalizeAuthResponse(data);
};

export const registerUser = async (payload) => {
  const { data } = await api.post(`${AUTH}/register`, payload);
  return normalizeAuthResponse(data);
};

export const logoutUser = async () => {
  try {
    const refreshToken = getRefreshToken();
    await api.post(`${AUTH}/logout`, refreshToken ? { refreshToken } : {});
  } catch {
  }
  clearAuthToken();
};

export const getCurrentUser = async () => {
  const { data } = await api.get(`${USERS}/me`);
  return data?.user || data?.data || data;
};

export const getUser = async (id) => {
  const { data } = await api.get(`${USERS}/${id}`);
  return data?.user || data?.data || data;
};

export const getUsers = async () => {
  const { data } = await api.get(USERS);
  return Array.isArray(data?.content) ? data.content : data;
};

export const getSuggestedUsers = async () => {
  const { data } = await api.get(`${USERS}/suggested`);
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
};

export const searchUsers = async (query) => {
  const { data } = await api.get(`${USERS}/search`, { params: { query } });
  return Array.isArray(data?.content) ? data.content : data;
};

export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  const { data } = await api.put(`${USERS}/profile-picture`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateProfilePicture = async ({ profilePicture }) => uploadProfilePicture(profilePicture);

export const updateProfile = async ({
  fullName,
  username,
  bio,
  gender,
  website,
  email,
  profilePicture,
  isPrivate,
}) => {
  const body = {
    fullName,
    username,
    bio,
    gender,
    website,
    email,
    profilePicture,
    isPrivate,
  };
  Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
  const { data } = await api.put(`${USERS}/profile`, body);
  return data;
};

export { getAuthToken, setAuthToken };
