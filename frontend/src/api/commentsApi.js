import axios from "axios";
import { API_BASE_URL } from "./config";

<<<<<<< HEAD
const FALLBACK_COMMENTS_KEY = "fallback_instagram_comments";
const SEED_FALLBACK_COMMENTS = {
  1: [
    {
      id: 101,
      postId: 1,
      userId: 2,
      username: "sam",
      fullName: "Sam",
      profilePicture: "https://i.pravatar.cc/150?img=11",
      text: "Wow, beautiful view! 😍 Where is this located?",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 102,
      postId: 1,
      userId: 3,
      username: "mountblue",
      fullName: "Mount Blue",
      profilePicture: "https://i.pravatar.cc/150?img=12",
      text: "Such magnificent lighting! Great capture.",
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]
};

const getFallbackComments = () => {
  const cached = localStorage.getItem(FALLBACK_COMMENTS_KEY);
  if (!cached) {
    localStorage.setItem(FALLBACK_COMMENTS_KEY, JSON.stringify(SEED_FALLBACK_COMMENTS));
    return SEED_FALLBACK_COMMENTS;
  }
  return JSON.parse(cached);
};

const saveFallbackComments = (comments) => {
  localStorage.setItem(FALLBACK_COMMENTS_KEY, JSON.stringify(comments));
};

export const getComments = async (postId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.warn("Backend comments offline, retrieving mock", error);
    const comments = getFallbackComments();
    return comments[postId] || [];
  }
};

export const addComment = async (postId, userId, text) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/posts/${postId}/comments?userId=${userId}&text=${encodeURIComponent(text)}`
    );
    return response.data;
  } catch (error) {
    console.warn("Backend offline, saving comment to local mocks", error);
    const comments = getFallbackComments();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || '{"id":1,"username":"lavanya","fullName":"Lavanya","profilePicture":"https://i.pravatar.cc/150?img=5"}');
    
    const newComment = {
      id: Date.now(),
      postId,
      userId: currentUser.id || 1,
      username: currentUser.username || "lavanya",
      fullName: currentUser.fullName || "Lavanya",
      profilePicture: currentUser.profilePicture || "https://i.pravatar.cc/150?img=5",
      text,
      createdAt: new Date().toISOString()
    };

    if (!comments[postId]) {
      comments[postId] = [];
    }
    comments[postId].push(newComment);
    saveFallbackComments(comments);
    return newComment;
  }
};

export const updateComment = async (commentId, userId, text) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/posts/comments/${commentId}?userId=${userId}&text=${encodeURIComponent(text)}`
    );
    return response.data;
  } catch (error) {
    console.warn("Backend offline, updating comment in local mocks", error);
    const comments = getFallbackComments();
    for (const postId in comments) {
      const list = comments[postId];
      const index = list.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        list[index].text = text;
        list[index].updatedAt = new Date().toISOString();
        saveFallbackComments(comments);
        return list[index];
      }
    }
    throw new Error("Local comment not found");
  }
};

export const deleteComment = async (commentId) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/posts/comments/${commentId}`);
    return true;
  } catch (error) {
    console.warn("Backend offline, deleting comment from local mocks", error);
    const comments = getFallbackComments();
    let deleted = false;
    for (const postId in comments) {
      const list = comments[postId];
      const filtered = list.filter((c) => c.id !== commentId);
      if (filtered.length !== list.length) {
        comments[postId] = filtered;
        deleted = true;
        break;
      }
    }
    if (deleted) {
      saveFallbackComments(comments);
      return true;
    }
    throw new Error("Local comment not found");
  }
};
=======
export const getComments = async (postId) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/posts/${postId}/comments`
  );
  return data;
};

export const addComment = async (postId, userId, text) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/api/posts/${postId}/comments`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const updateComment = async (commentId, userId, text) => {
  const { data } = await axios.put(
    `${API_BASE_URL}/api/posts/comments/${commentId}`,
    null,
    {
      params: { userId, text },
    }
  );
  return data;
};

export const deleteComment = async (commentId) => {
  await axios.delete(
    `${API_BASE_URL}/api/posts/comments/${commentId}`
  );
  return true;
};
>>>>>>> postInteractions
