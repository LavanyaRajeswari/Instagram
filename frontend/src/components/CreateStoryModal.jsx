import { useState } from "react";
import { X } from "lucide-react";
import { createStory } from "../api/storiesApi";
import { useCurrentUser } from "../hooks/useCurrentUser";

function CreateStoryModal({ onClose, onStoryCreated }) {
  const { currentUserId } = useCurrentUser();
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMedia(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!media) {
      alert("Please select image or video");
      return;
    }

    if (!currentUserId) {
      alert("Please login first");
      return;
    }

    try {
      setLoading(true);
      await createStory({ userId: currentUserId, caption, media });
      await onStoryCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Story upload failed");
    } finally {
      setLoading(false);
    }
  };

  const isVideo = media?.type?.startsWith("video");

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-xl bg-white">
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
            <label className="flex h-[320px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
              Select story media
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>
          )}

          {preview && (
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
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