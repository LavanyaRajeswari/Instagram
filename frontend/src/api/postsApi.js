import axios from "axios";
import { API_BASE_URL } from "./config";

<<<<<<< HEAD
// In-memory fallback if backend is offline, to make UI resilient
const FALLBACK_POSTS_KEY = "fallback_instagram_posts";
const SEED_FALLBACK_POSTS = [
  {
    id: 1,
    caption: "Chasing sunsets in the valleys 🌅🌲 #nature #adventure",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likeCount: 42,
    likedByCurrentUser: true,
    user: {
      id: 1,
      username: "lavanya",
      fullName: "Lavanya",
      profilePicture: "https://i.pravatar.cc/150?img=5"
    },
    media: [{ mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80" }]
  },
  {
    id: 2,
    caption: "Perfect Sunday brunch setup! 🥞☕️ Cooking is my meditation.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likeCount: 128,
    likedByCurrentUser: false,
    user: {
      id: 2,
      username: "sam",
      fullName: "Sam",
      profilePicture: "https://i.pravatar.cc/150?img=11"
    },
    media: [{ mediaUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80" }]
  }
];

const getFallbackPosts = () => {
  const cached = localStorage.getItem(FALLBACK_POSTS_KEY);
  if (!cached) {
    localStorage.setItem(FALLBACK_POSTS_KEY, JSON.stringify(SEED_FALLBACK_POSTS));
    return SEED_FALLBACK_POSTS;
  }
  return JSON.parse(cached);
};

const saveFallbackPosts = (posts) => {
  localStorage.setItem(FALLBACK_POSTS_KEY, JSON.stringify(posts));
};

export const getPosts = async (userId = 1) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/posts?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.warn("Backend dynamic offline, retrieving local storage template items", error);
    return getFallbackPosts();
  }
};

export const createPost = async ({ userId, caption, images }) => {
  try {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("caption", caption || "");
    
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    const response = await axios.post(`${API_BASE_URL}/api/posts`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline, adding to local storage mock posts", error);
    const posts = getFallbackPosts();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || '{"id":1,"username":"lavanya","fullName":"Lavanya","profilePicture":"https://i.pravatar.cc/150?img=5"}');
    
    // Simulate image read
    let mediaUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
    if (images && images[0]) {
      if (images[0] instanceof File) {
        mediaUrl = URL.createObjectURL(images[0]);
      } else if (typeof images[0] === "string") {
        mediaUrl = images[0];
      }
    }

    const mockPost = {
      id: Date.now(),
      caption,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      likedByCurrentUser: false,
      user: {
        id: currentUser.id || 1,
        username: currentUser.username || "lavanya",
        fullName: currentUser.fullName || "Lavanya",
        profilePicture: currentUser.profilePicture || "https://i.pravatar.cc/150?img=5"
      },
      media: [{ mediaUrl, mediaType: "IMAGE" }]
    };

    posts.unshift(mockPost);
    saveFallbackPosts(posts);
    return mockPost;
  }
};

export const deletePost = async (postId) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/posts/${postId}`);
    return true;
  } catch (error) {
    console.warn("Backend offline, deleting from local storage mock posts", error);
    const posts = getFallbackPosts();
    const filtered = posts.filter(p => p.id !== postId);
    saveFallbackPosts(filtered);
    return true;
  }
};

export const updatePost = async ({ postId, caption, images }) => {
  try {
    const formData = new FormData();
    formData.append("caption", caption || "");
    
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    const response = await axios.put(`${API_BASE_URL}/api/posts/${postId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline, updating local storage mock posts", error);
    const posts = getFallbackPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      posts[index].caption = caption;
      if (images && images[0]) {
        if (images[0] instanceof File) {
          posts[index].media = [{ mediaUrl: URL.createObjectURL(images[0]), mediaType: "IMAGE" }];
        }
      }
      saveFallbackPosts(posts);
      return posts[index];
    }
    throw new Error("Local post not found for updates");
  }
};
=======
const POSTS_API_URL = `${API_BASE_URL}/api/posts`;

export const getPosts = async (userId = 1) => {
  const response = await axios.get(POSTS_API_URL, {
    params: { userId },
  });
  return response.data;
};

export const getPostById = async (id) => {
  const response = await axios.get(`${POSTS_API_URL}/${id}`);
  return response.data;
};

export const createPost = async ({ userId, caption, images = [] }) => {
  const formData = new FormData();

  formData.append("userId", userId);
  formData.append("caption", caption || "");

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.post(POSTS_API_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updatePost = async ({ postId, caption, images = [] }) => {
  const formData = new FormData();

  formData.append("caption", caption || "");

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axios.put(`${POSTS_API_URL}/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deletePost = async (postId) => {
  await axios.delete(`${POSTS_API_URL}/${postId}`);
  return true;
};
>>>>>>> postInteractions
