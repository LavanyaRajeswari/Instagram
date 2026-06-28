import { api } from "./client";

export const sendFollowRequest = async (userId) => {
  const { data } = await api.post(`/follow-requests/${userId}`);
  return data;
};

export const acceptFollowRequest = async (requestId) => {
  const { data } = await api.post(`/follow-requests/${requestId}/accept`);
  return data;
};

export const rejectFollowRequest = async (requestId) => {
  const { data } = await api.delete(`/follow-requests/${requestId}/reject`);
  return data;
};

export const getPendingFollowRequests = async () => {
  const { data } = await api.get("/follow-requests/pending");
  return Array.isArray(data) ? data : [];
};

export const getPendingFollowRequestsCount = async () => {
  const { data } = await api.get("/follow-requests/pending/count");
  return data?.count ?? data ?? 0;
};

export const cancelFollowRequest = async (userId) => {
  const { data } = await api.delete(`/follow-requests/${userId}/cancel`);
  return data;
};
