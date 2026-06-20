import axios from "axios";
import { API_BASE_URL } from "./config";

const POSTS_API_URL = `${API_BASE_URL}/posts`;

export const sharePost = async ({
  postId,
  userId,
  receiverId = null,
  shareType = "COPY_LINK",
}) => {
  const { data } = await axios.post(`${POSTS_API_URL}/${postId}/share`, null, {
    params: {
      userId,
      receiverId,
      shareType,
    },
  });

  return data;
};

export const getShareCount = async (postId) => {
  const { data } = await axios.get(`${POSTS_API_URL}/${postId}/shares`);
  return data;
};