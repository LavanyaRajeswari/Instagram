import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getStories } from "../api/storiesApi";
import { getAvatarUrl } from "../utils/avatar";
import StoryViewer from "./StoryViewer";
import CreateStoryModal from "./CreateStoryModal";
import { useCurrentUser } from "../hooks/useCurrentUser";

function StoriesBar() {
  const { currentUser } = useCurrentUser();
  const [stories, setStories] = useState([]);
  const [selectedUserStories, setSelectedUserStories] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadStories = async () => {
    try {
      const data = await getStories();
      setStories(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    loadStories();
  }, []);

  const groupedStories = useMemo(() => {
    const map = new Map();
    stories.forEach((story) => {
      const userId = story.user?.id || "unknown";
      if (!map.has(userId)) {
        map.set(userId, { user: story.user, stories: [] });
      }
      map.get(userId).stories.push(story);
    });

    map.forEach((item) => {
      item.stories.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    });

    const groups = Array.from(map.values());
    const currentGroup = groups.find((item) => String(item.user?.id) === String(currentUser?.id));
    const otherGroups = groups.filter((item) => String(item.user?.id) !== String(currentUser?.id));

    return { currentGroup, otherGroups };
  }, [stories, currentUser?.id]);

  const currentStoryItem = groupedStories.currentGroup || { user: currentUser, stories: [] };

  return (
    <>
      <div className="mb-4 flex w-full gap-2 overflow-x-auto rounded-lg border border-primary bg-card px-3 py-3 scrollbar-hide">
        <div className="flex w-[80px] shrink-0 flex-col items-center gap-1">
          <div className="relative rounded-full p-[2px]" style={{ background: "var(--story-ring)" }}>
            <button
              type="button"
              onClick={() =>
                currentStoryItem.stories.length > 0
                  ? setSelectedUserStories(currentStoryItem)
                  : setCreateOpen(true)
              }
              className="block"
            >
              <img
                src={getAvatarUrl(currentUser)}
                alt="Your story"
                loading="lazy"
                className="h-16 w-16 rounded-full border-2 border-card object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="absolute -bottom-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-[#0095f6] text-white"
              aria-label="Create story"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="w-full truncate text-center text-xs text-primary">Your story</span>
        </div>

        {groupedStories.otherGroups.map((item) => (
          <button
            key={item.user?.id}
            type="button"
            onClick={() => setSelectedUserStories(item)}
            className="flex w-[80px] shrink-0 flex-col items-center gap-1"
          >
            <div className="rounded-full p-[2px]" style={{ background: "var(--story-ring)" }}>
              <img
                src={getAvatarUrl(item.user)}
                alt={item.user?.username}
                loading="lazy"
                className="h-16 w-16 rounded-full border-2 border-card object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
            </div>
            <span className="w-full truncate text-center text-xs text-primary">
              {item.user?.username || "user"}
            </span>
          </button>
        ))}
      </div>

      {selectedUserStories && (
        <StoryViewer
          user={selectedUserStories.user}
          stories={selectedUserStories.stories}
          onClose={() => setSelectedUserStories(null)}
        />
      )}

      {createOpen && (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onStoryCreated={loadStories}
        />
      )}
    </>
  );
}

export default StoriesBar;
