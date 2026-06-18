import axios from "axios";

const API_URL = "http://localhost:8080/api/posts";

export const likePost = async (postId, userId) => {
  const { data } = await axios.post(
    `${API_URL}/${postId}/like`,
    null,
    {
      params: { userId },
    }
  );

  return data;
};

export const unlikePost = async (postId, userId) => {
  const { data } = await axios.delete(
    `${API_URL}/${postId}/like`,
    {
      params: { userId },
    }
  );

  return data;
};