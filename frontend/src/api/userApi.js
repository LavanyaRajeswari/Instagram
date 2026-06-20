import axios from "axios";
import { API_BASE_URL } from "./config";

const USERS_API_URL = `${API_BASE_URL}/users`;

export const registerUser = async (data) => {
  const response = await axios.post(`${USERS_API_URL}/register`, data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await axios.post(`${USERS_API_URL}/login`, data);
  return response.data;
};

export const getUser = async (id) => {
  const response = await axios.get(`${USERS_API_URL}/${id}`);
  return response.data;
};

export const getUsers = async () => {
  const response = await axios.get("http://localhost:8080/api/users");
  return response.data;
};