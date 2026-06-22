import { api } from "./config";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const getUnreadNotificationCount = async () => {
  const { data } = await api.get("/notifications/unread");
  return data?.count ?? 0;
};

export const markNotificationSeen = async (id) => {
  await api.put(`/notifications/${id}/seen`);
  return true;
};

export const markAllNotificationsSeen = async () => {
  await api.put("/notifications/seen/all");
  return true;
};
