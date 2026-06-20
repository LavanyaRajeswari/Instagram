import axios from "axios";
import { API_BASE_URL } from "./config";

const REELS_API_URL = `${API_BASE_URL}/reels`;

export const getReels = async ({ page = 0, size = 10 } = {}) => {
  const response = await axios.get(REELS_API_URL, {
    params: { page, size },
  });

  return response.data;
};
