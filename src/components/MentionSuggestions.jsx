import { useEffect, useState } from "react";
import { searchUsers } from "../api/userApi";
import { getAvatarUrl } from "../utils/avatar";

function MentionSuggestions({ query, onSelect }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchUsers(trimmed);
        setUsers(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (error) {
        console.error("Mention search failed", error);
        setUsers([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!query || users.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-[130] mt-1 overflow-hidden rounded-lg border border-[#dbdbdb] bg-white shadow-xl">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#fafafa]"
        >
          <img src={getAvatarUrl(user)} alt="" className="h-8 w-8 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <p className="truncate text-xs text-[#737373]">{user.fullName}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;
