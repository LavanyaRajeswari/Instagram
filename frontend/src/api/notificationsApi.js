import { api } from "./client";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const getUnreadNotificationCount = async () => {
  const { data } = await api.get("/notifications/unread");
  return typeof data === "number" ? data : data?.count ?? 0;
};

export const markNotificationSeen = async (id) => {
  await api.put(`/notifications/${id}/seen`);
  return true;
};

export const markAllNotificationsSeen = async () => {
  await api.put("/notifications/seen/all");
  return true;
};
