import { api } from "./client";

const CLOSE_FRIENDS = "/close-friends";

export const getCloseFriends = async () => {
    const { data } = await api.get(CLOSE_FRIENDS);
    return Array.isArray(data) ? data : [];
};

export const addCloseFriend = async (friendId) => {
    const { data } = await api.post(`${CLOSE_FRIENDS}/${friendId}`);
    return data;
};

export const removeCloseFriend = async (friendId) => {
    const { data } = await api.delete(`${CLOSE_FRIENDS}/${friendId}`);
    return data;
};

export const isCloseFriend = async (friendId) => {
    const { data } = await api.get(`${CLOSE_FRIENDS}/${friendId}/status`);
    return typeof data === "boolean" ? data : Boolean(data?.status ?? data?.isCloseFriend);
};
