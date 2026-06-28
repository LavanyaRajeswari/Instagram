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

export const cancelFollowRequest = async (userId) => {
  const { data } = await api.delete(`/follow-requests/${userId}/cancel`);
  return data;
};
