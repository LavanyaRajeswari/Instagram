import { useEffect, useState } from "react";
import { getSuggestedUsers, searchUsers } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";

function MentionSuggestions({ query, onSelect, active = Boolean(query) }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!active) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const trimmed = query.trim();
        const data = trimmed ? await searchUsers(trimmed) : await getSuggestedUsers();
        setUsers(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (error) {
       
        setUsers([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, active]);

  if (!active || users.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-[130] mt-1 overflow-hidden rounded-lg border border-primary bg-card shadow-xl">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary"
        >
          <img src={getAvatarUrl(user)} alt="" className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <p className="truncate text-xs text-secondary">{user.fullName}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;
