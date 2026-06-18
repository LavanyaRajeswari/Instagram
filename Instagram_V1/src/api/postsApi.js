import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/posts";

export const getPosts = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const getPostById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createPost = async ({
  userId,
  caption,
  images,
}) => {

  const formData = new FormData();

  formData.append("userId", userId);
  formData.append("caption", caption);

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.post(
    API_BASE_URL,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const updatePost = async ({
  postId,
  caption,
  images,
}) => {

  const formData = new FormData();

  formData.append("caption", caption);

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.put(
    `${API_BASE_URL}/${postId}`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const deletePost = async (postId) => {
  await axios.delete(
    `${API_BASE_URL}/${postId}`
  );
};