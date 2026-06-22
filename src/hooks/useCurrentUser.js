import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/userApi";

let cachedCurrentUser = null;
let pendingCurrentUser = null;

const loadCurrentUser = async () => {
  if (cachedCurrentUser) return cachedCurrentUser;
  if (!pendingCurrentUser) {
    pendingCurrentUser = getCurrentUser()
      .then((user) => {
        cachedCurrentUser = user;
        return user;
      })
      .finally(() => {
        pendingCurrentUser = null;
      });
  }

  return pendingCurrentUser;
};

export const clearCurrentUserCache = () => {
  cachedCurrentUser = null;
  pendingCurrentUser = null;
};

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(cachedCurrentUser);
  const [loading, setLoading] = useState(!cachedCurrentUser);

  useEffect(() => {
    let active = true;

    loadCurrentUser()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    currentUser,
    currentUserId: currentUser?.id,
    currentUserLoading: loading,
  };
}
