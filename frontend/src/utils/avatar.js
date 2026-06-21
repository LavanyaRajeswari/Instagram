import defaultAvatar from "../assets/default-avatar.jpg";

export const getAvatarUrl = (user) => user?.profilePicture || defaultAvatar;

export { defaultAvatar };
