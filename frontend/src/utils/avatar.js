import defaultAvatar from "../assets/default-avatar.png";

export const getAvatarUrl = (user) => user?.profilePicture || defaultAvatar;

export { defaultAvatar };
