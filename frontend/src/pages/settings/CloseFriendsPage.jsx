import { useEffect, useState } from "react";

import { getCloseFriends } from "../../api/closeFriendsApi";
import { getAvatarUrl } from "../../utils/avatar";

function CloseFriendsPage() {
    const [closeFriends, setCloseFriends] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCloseFriends()
            .then((data) => setCloseFriends(Array.isArray(data) ? data : []))
            .catch(() => setCloseFriends([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredFriends = closeFriends.filter((user) => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return true;
        return (
            user.username?.toLowerCase().includes(normalizedQuery) ||
            user.fullName?.toLowerCase().includes(normalizedQuery)
        );
    });

    return (
        <>
            <h1 className="text-2xl font-bold">Close Friends</h1>
            <div className="mt-6">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search close friends"
                    className="h-11 w-full rounded-lg border border-[var(--border-primary)] px-3 text-sm outline-none focus:border-[var(--text-secondary)]"
                />
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border-primary)]">
                {loading ? (
                    <p className="p-4 text-sm text-[var(--text-secondary)]">Loading...</p>
                ) : filteredFriends.length === 0 ? (
                    <p className="p-4 text-sm text-[var(--text-secondary)]">
                        {query.trim() ? "No close friends match your search." : "No close friends yet."}
                    </p>
                ) : (
                    filteredFriends.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-3 border-b border-[var(--border-secondary)] px-4 py-3 last:border-b-0"
                        >
                            <img
                                src={getAvatarUrl(user)}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                                onError={(e) => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.onerror = null; }}
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{user.username}</p>
                                <p className="truncate text-xs text-[var(--text-secondary)]">{user.fullName}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

export default CloseFriendsPage;
