import { useRef, useState } from "react";
import { Music, X } from "lucide-react";
import { createStory, getStoryMusic, setStoryMusic } from "../api/storiesApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import MentionSuggestions from "./MentionSuggestions";

function CreateStoryModal({ onClose, onStoryCreated }) {
  const { currentUserId } = useCurrentUser();
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [musicOptions, setMusicOptions] = useState([]);
  const [selectedMusicId, setSelectedMusicId] = useState("");
  const [step, setStep] = useState("media");
  const captionRef = useRef(null);

  const mentionMatch = caption.slice(0, captionRef.current?.selectionStart ?? caption.length).match(/@([A-Za-z0-9_]*)$/);
  const mentionQuery = mentionMatch ? mentionMatch[1] : "";

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMedia(file);
    setPreview(URL.createObjectURL(file));
    setStep("music");
    getStoryMusic()
      .then((songs) => {
        const sorted = [...(Array.isArray(songs) ? songs : [])].sort((a, b) =>
          String(a?.title || "").localeCompare(String(b?.title || ""))
        );
        setMusicOptions(sorted);
      })
      .catch(() => setMusicOptions([]));
  };

  const handleSubmit = async () => {
    if (!media) {
     
      return;
    }

    if (!currentUserId) {
      return;
    }

    try {
      setLoading(true);
      const story = await createStory({ userId: currentUserId, caption, media });
      if (selectedMusicId && story?.id) {
        await setStoryMusic(story.id, selectedMusicId);
      }
      await onStoryCreated?.();
      onClose();
    } catch {  } finally {
      setLoading(false);
    }
  };

  const isVideo = media?.type?.startsWith("video");

  const insertMention = (user) => {
    const input = captionRef.current;
    const cursor = input?.selectionStart ?? caption.length;
    const beforeCursor = caption.slice(0, cursor).replace(/@([A-Za-z0-9_]*)$/, `@${user.username} `);
    setCaption(`${beforeCursor}${caption.slice(cursor)}`);
    requestAnimationFrame(() => {
      captionRef.current?.focus();
      captionRef.current?.setSelectionRange(beforeCursor.length, beforeCursor.length);
    });
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-xl bg-card">
        <div className="relative flex h-12 items-center justify-center border-b">
          <h2 className="text-sm font-semibold">Create story</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {preview ? (
            isVideo ? (
              <video
                src={preview}
                controls
                className="h-[420px] w-full rounded-lg bg-black object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="h-[420px] w-full rounded-lg bg-black object-contain"
              />
            )
          ) : (
            <label className="flex h-[320px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-primary text-sm text-secondary">
              Select story media
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>
          )}

          {preview && step === "music" && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Music className="h-4 w-4" />
                Select a song
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-primary">
                <label className="flex cursor-pointer items-center gap-3 border-b border-secondary px-3 py-2 text-sm">
                  <input type="radio" name="story-music" checked={!selectedMusicId} onChange={() => setSelectedMusicId("")} />
                  No music
                </label>
                {musicOptions.map((song) => (
                  <label key={song.id} className="flex cursor-pointer items-center gap-3 border-b border-secondary px-3 py-2 text-sm last:border-b-0">
                    <input type="radio" name="story-music" checked={String(selectedMusicId) === String(song.id)} onChange={() => setSelectedMusicId(song.id)} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{song.title}</span>
                      <span className="block truncate text-xs text-secondary">{song.artist}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {preview && (
            <div className="relative mt-4">
              <input
                ref={captionRef}
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
              <MentionSuggestions query={mentionQuery} active={Boolean(mentionMatch)} onSelect={insertMention} />
            </div>
          )}

          <button
            type="button"
            disabled={loading || !media}
            onClick={handleSubmit}
            className="mt-4 w-full rounded-lg bg-[#0095f6] py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Share story"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateStoryModal;
