import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { createHighlight, deleteHighlight, getUserHighlights } from "../../api/highlightsApi";
import { getStories } from "../../api/storiesApi";

function ProfileHighlights({ user, isOwnProfile }) {
    const [highlights, setHighlights] = useState([]);
    const [stories, setStories] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [selectedStoryIds, setSelectedStoryIds] = useState([]);
    const [saving, setSaving] = useState(false);

    const loadHighlights = async () => {
        if (!user?.id) return;
        try {
            const data = await getUserHighlights(user.id);
            setHighlights(data);
        } catch (error) {
            console.error("Failed to load highlights", error);
            setHighlights([]);
        }
    };

    useEffect(() => {
        loadHighlights();
    }, [user?.id]);

    useEffect(() => {
        if (!createOpen || !user?.id) return;
        getStories()
            .then((data) => {
                const ownStories = (Array.isArray(data) ? data : []).filter(
                    (story) => String(story.user?.id) === String(user.id)
                );
                setStories(ownStories);
            })
            .catch(() => setStories([]));
    }, [createOpen, user?.id]);

    const storyById = useMemo(() => {
        const map = new Map();
        stories.forEach((story) => map.set(String(story.id), story));
        return map;
    }, [stories]);

    const toggleStory = (storyId) => {
        setSelectedStoryIds((prev) =>
            prev.includes(storyId)
                ? prev.filter((id) => id !== storyId)
                : [...prev, storyId]
        );
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!title.trim() || selectedStoryIds.length === 0) return;
        setSaving(true);
        try {
            const coverStory = storyById.get(String(selectedStoryIds[0]));
            await createHighlight({
                title: title.trim(),
                storyIds: selectedStoryIds,
                coverUrl: coverStory?.mediaUrl,
            });
            setTitle("");
            setSelectedStoryIds([]);
            setCreateOpen(false);
            await loadHighlights();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (highlightId) => {
        await deleteHighlight(highlightId);
        await loadHighlights();
    };

    return (
        <>
        <div
            className="
                mx-auto
                mt-[43px]
                flex
                w-full
                max-w-[613px]
                justify-center
                sm:justify-start
                sm:pl-[16px]
            "
        >
            <div className="flex gap-5 overflow-x-auto">
            {isOwnProfile && (
            <button type="button" onClick={() => setCreateOpen(true)} className="flex flex-col items-center">

                <div
                    className="
                        h-[76px]
                        w-[76px]
                        rounded-full
                        border-[3px]
                        border-[#dbdbdb]
                        bg-[#efefef]
                        p-[3px]
                    "
                >
                    <div
                        className="
                            h-full
                            w-full
                            rounded-full
                            border-[2px]
                            border-[#ffffff]
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <Plus
                            size={40}
                            strokeWidth={1.8}
                            className="text-[#737373]"
                        />
                    </div>
                </div>

                <span
                    className="
                        mt-2
                        text-[12px]
                        font-semibold
                        leading-[15px]
                    "
                >
                    New
                </span>

            </button>
            )}

            {highlights.map((highlight) => (
                <div key={highlight.id} className="group flex flex-col items-center">
                    <div className="relative h-[76px] w-[76px] overflow-hidden rounded-full border-[3px] border-[#dbdbdb] bg-[#efefef] p-[3px]">
                        {highlight.coverUrl ? (
                            <img src={highlight.coverUrl} alt={highlight.title} className="h-full w-full rounded-full border-2 border-white object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white text-lg font-semibold text-[#737373]">
                                {highlight.title?.[0]?.toUpperCase() || "H"}
                            </div>
                        )}
                        {isOwnProfile && (
                            <button
                                type="button"
                                onClick={() => handleDelete(highlight.id)}
                                className="absolute inset-0 hidden items-center justify-center bg-black/45 text-white group-hover:flex"
                                aria-label="Delete highlight"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <span className="mt-2 max-w-[76px] truncate text-[12px] font-semibold leading-[15px]">
                        {highlight.title}
                    </span>
                </div>
            ))}
            </div>
        </div>

        {createOpen && (
            <div className="fixed inset-0 z-[90000] flex items-center justify-center bg-black/60 p-4" onClick={() => setCreateOpen(false)}>
                <form onSubmit={handleCreate} className="w-full max-w-[420px] rounded-xl bg-white" onClick={(event) => event.stopPropagation()}>
                    <div className="relative flex h-12 items-center justify-center border-b border-[#dbdbdb]">
                        <button type="button" onClick={() => setCreateOpen(false)} className="absolute left-4">
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="text-sm font-bold">New Highlight</h2>
                    </div>
                    <div className="p-4">
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Highlight name"
                            className="h-10 w-full rounded-lg border border-[#dbdbdb] px-3 text-sm outline-none"
                            maxLength={100}
                        />
                        <div className="mt-4 grid max-h-[300px] grid-cols-3 gap-2 overflow-y-auto">
                            {stories.map((story) => (
                                <button
                                    key={story.id}
                                    type="button"
                                    onClick={() => toggleStory(story.id)}
                                    className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedStoryIds.includes(story.id) ? "border-[#0095f6]" : "border-transparent"}`}
                                >
                                    <img src={story.mediaUrl} alt={story.caption || "story"} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                        {stories.length === 0 && (
                            <p className="mt-4 text-center text-sm text-[#737373]">
                                No backend story media available to add.
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={saving || !title.trim() || selectedStoryIds.length === 0}
                            className="mt-4 h-10 w-full rounded-lg bg-[#0095f6] text-sm font-bold text-white disabled:opacity-40"
                        >
                            {saving ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        )}
        </>
    );
}

export default ProfileHighlights;
