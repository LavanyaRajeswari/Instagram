import axios from "axios";

const API_URL = "http://localhost:8080/api/posts";

export const addComment = async (
  postId,
  userId,
  text
) => {

  const { data } = await axios.post(
    `${API_URL}/${postId}/comments`,
    null,
    {
      params: {
        userId,
        text,
      },
    }
  );

  return data;
};