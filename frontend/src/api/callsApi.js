import { api, unwrapPage } from "./client";

export const getCallHistory = async () => {
  const { data } = await api.get("/calls/history");
  return unwrapPage(data);
};

export const getCallById = async (callId) => {
  const { data } = await api.get(`/calls/${callId}`);
  return data;
};

export const answerCall = async (callId) => {
  const { data } = await api.post(`/calls/${callId}/answer`);
  return data;
};

export const rejectCall = async (callId) => {
  const { data } = await api.post(`/calls/${callId}/reject`);
  return data;
};

export const cancelCall = async (callId) => {
  const { data } = await api.post(`/calls/${callId}/cancel`);
  return data;
};

export const endCall = async (callId) => {
  const { data } = await api.post(`/calls/${callId}/end`);
  return data;
};

export const leaveCall = async (callId) => {
  const { data } = await api.post(`/calls/${callId}/leave`);
  return data;
};

export const startCall = async (userId, callType = "VOICE") => {
  const { data } = await api.post(`/calls/start/${userId}`, { callType });
  return data;
};

export const startGroupCall = async (groupId, callType = "VOICE") => {
  const { data } = await api.post(`/calls/group/start/${groupId}`, { callType });
  return data;
};
