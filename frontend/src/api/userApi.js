import axios from "axios";
import { API_BASE_URL } from "./config";

const USERS_API_URL = `${API_BASE_URL}/users`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerUser = async (data) => {
  const response = await axios.post(`${USERS_API_URL}/register`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const loginUser = async (data) => {
  const response = await axios.post(`${USERS_API_URL}/login`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${USERS_API_URL}/me`, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return response.data;
};

export const getUser = async (id) => {
  const response = await axios.get(`${USERS_API_URL}/${id}`);
  return response.data;
};

export const getUsers = async () => {
  const response = await axios.get(USERS_API_URL);
  return response.data;
};

export const updateProfilePicture = async ({ userId, profilePicture }) => {
  const formData = new FormData();
  formData.append("profilePicture", profilePicture);

  const response = await axios.put(`${USERS_API_URL}/${userId}/profile-picture`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
  });

  return response.data;
};
