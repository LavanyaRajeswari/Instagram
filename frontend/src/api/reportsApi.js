import { api } from "./client";

export const createReport = async ({ targetType, targetId = 0, reason, description = "" }) => {
  const { data } = await api.post("/reports", {
    targetType,
    targetId: Number(targetId) || 0,
    reason,
    description,
  });
  return data;
};

export const reportUser = async (userId, { reason, description = "" }) => {
  const { data } = await api.post("/reports", {
    targetType: "USER",
    targetId: Number(userId),
    reason,
    description,
  });
  return data;
};

export const reportPost = async (postId, { reason, description = "" }) => {
  const { data } = await api.post("/reports", {
    targetType: "POST",
    targetId: Number(postId),
    reason,
    description,
  });
  return data;
};

export const reportMessage = async (messageId, { reason, description = "" }) => {
  const { data } = await api.post("/reports", {
    targetType: "MESSAGE",
    targetId: Number(messageId),
    reason,
    description,
  });
  return data;
};

export const reportChat = async (chatId, { reason, description = "" }) => {
  const { data } = await api.post("/reports", {
    targetType: "CHAT",
    targetId: Number(chatId),
    reason,
    description,
  });
  return data;
};

export const reportStory = async (storyId, { reason, description = "" }) => {
  const { data } = await api.post("/reports", {
    targetType: "STORY",
    targetId: Number(storyId),
    reason,
    description,
  });
  return data;
};


