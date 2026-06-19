import axios from "axios";
import { API_BASE_URL } from "./config";

export const likePost = async (postId, userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/posts/${postId}/like?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.warn("Backend offline, updating local mock like", error);
    const data = localStorage.getItem("fallback_instagram_posts");
    if (data) {
      const posts = JSON.parse(data);
      const index = posts.findIndex((p) => p.id === postId);
      if (index !== -1) {
        posts[index].likeCount = (posts[index].likeCount || 0) + 1;
        posts[index].likedByCurrentUser = true;
        localStorage.setItem("fallback_instagram_posts", JSON.stringify(posts));
        return posts[index];
      }
    }
    return null;
  }
};

export const unlikePost = async (postId, userId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/posts/${postId}/like?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.warn("Backend offline, updating local mock unlike", error);
    const data = localStorage.getItem("fallback_instagram_posts");
    if (data) {
      const posts = JSON.parse(data);
      const index = posts.findIndex((p) => p.id === postId);
      if (index !== -1) {
        posts[index].likeCount = Math.max((posts[index].likeCount || 0) - 1, 0);
        posts[index].likedByCurrentUser = false;
        localStorage.setItem("fallback_instagram_posts", JSON.stringify(posts));
        return posts[index];
      }
    }
    return null;
  }
};
