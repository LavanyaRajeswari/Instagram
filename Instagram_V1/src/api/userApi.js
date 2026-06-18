import axios from "axios";

const API_URL =
  "http://localhost:8080/api/users";

export const getUserById = async (id) => {

  const { data } =
    await axios.get(`${API_URL}/${id}`);

  return data;
};