const DEFAULT_AVATAR = "/default-avatar.png";

export const getAvatarUrl = (user) => {
  if (!user) return DEFAULT_AVATAR;
  if (typeof user === "string") return user || DEFAULT_AVATAR;
  return user?.profilePicture || user?.profile_image || user?.avatar || DEFAULT_AVATAR;
};

export const onAvatarError = (e) => {
  e.currentTarget.src = import.meta.env.VITE_DEFAULT_AVATAR || DEFAULT_AVATAR;
  e.currentTarget.onerror = null;
};

export const defaultAvatar = DEFAULT_AVATAR;
