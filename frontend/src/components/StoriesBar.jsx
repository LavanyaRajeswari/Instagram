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
    } catch (error) {
      console.error("Failed to load stories:", error);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const groupedStories = useMemo(() => {
    const map = new Map();

    stories.forEach((story) => {
      const userId = story.user?.id || "unknown";
      if (!map.has(userId)) {
        map.set(userId, {
          user: story.user,
          stories: [],
        });
      }
      map.get(userId).stories.push(story);
    });

    return Array.from(map.values());
  }, [stories]);

  return (
    <>
      <div className="mb-6 flex w-full gap-4 overflow-x-auto rounded-lg border border-[#dbdbdb] bg-white px-4 py-4">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex w-[70px] shrink-0 flex-col items-center gap-1"
        >
          <div className="relative">
            <img
              src={getAvatarUrl(currentUser)}
              alt="Your story"
              className="h-14 w-14 rounded-full border object-cover"
            />
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#0095f6] text-white">
              <Plus className="h-3 w-3" />
            </span>
          </div>
          <span className="w-full truncate text-xs">Your story</span>
        </button>

        {groupedStories.map((item) => (
          <button
            key={item.user?.id}
            type="button"
            onClick={() => setSelectedUserStories(item)}
            className="flex w-[70px] shrink-0 flex-col items-center gap-1"
          >
            <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <img
                src={getAvatarUrl(item.user)}
                alt={item.user?.username}
                className="h-14 w-14 rounded-full border-2 border-white object-cover"
              />
            </div>
            <span className="w-full truncate text-xs">
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