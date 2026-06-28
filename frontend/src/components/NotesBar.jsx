import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { getActiveNotes, createNote } from "../api/notesApi";
import { getAvatarUrl } from "../utils/avatar";
import { useCurrentUser } from "../hooks/useCurrentUser";

function NotesBar() {
  const { currentUser } = useCurrentUser();
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createText, setCreateText] = useState("");
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    try {
      const data = await getActiveNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const currentUserHasNote = notes.some(
    (n) => String(n.user?.id) === String(currentUser?.id)
  );

  const getHoursUntilExpiry = (expiresAt) => {
    if (!expiresAt) return 24;
    return Math.max(0, (new Date(expiresAt) - new Date()) / (1000 * 60 * 60));
  };

  const isExpiringSoon = (expiresAt) => getHoursUntilExpiry(expiresAt) < 1;

  const handleCreateNote = async () => {
    if (!createText.trim() || loading) return;
    try {
      setLoading(true);
      await createNote({ text: createText.trim() });
      setCreateText("");
      setShowCreate(false);
      loadNotes();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const gradient = "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)";

  return (
    <>
      <div className="flex w-full gap-3 overflow-x-auto px-4 py-2">
        {!currentUserHasNote && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex w-[56px] shrink-0 flex-col items-center gap-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-primary">
              <Plus className="h-5 w-5 text-secondary" />
            </div>
            <span className="w-full truncate text-center text-[10px] text-secondary">
              Your note
            </span>
          </button>
        )}

        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setActiveNote(note)}
            className={`flex w-[56px] shrink-0 flex-col items-center gap-1 ${
              isExpiringSoon(note.expiresAt) ? "opacity-50" : ""
            }`}
          >
            <div className="rounded-full p-[2px]" style={{ background: note.color || gradient }}>
              <img
                src={getAvatarUrl(note.user)}
                alt={note.user?.username}
                className="h-10 w-10 rounded-full border-2 border-card object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
            </div>
            <span className="w-full truncate text-center text-[10px] text-primary">
              {note.user?.username}
            </span>
          </button>
        ))}
      </div>

      {activeNote && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => setActiveNote(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-96 rounded-xl bg-card border border-primary p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveNote(null)}
              className="absolute right-2 top-2 p-1 rounded-full hover:bg-secondary"
            >
              <X className="h-4 w-4 text-secondary" />
            </button>
            <div className="mb-3 flex items-center gap-3">
              <img
                src={getAvatarUrl(activeNote.user)}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
              />
              <div>
                <p className="text-sm font-semibold text-primary">{activeNote.user?.username}</p>
                <p className="text-[10px] text-secondary">
                  {Math.floor(getHoursUntilExpiry(activeNote.expiresAt))}h remaining
                </p>
              </div>
            </div>
            <p className="text-sm text-primary">{activeNote.text}</p>
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowCreate(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-80 rounded-xl bg-card border border-primary p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Create note</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-secondary">
                <X className="h-4 w-4 text-secondary" />
              </button>
            </div>
            <textarea
              value={createText}
              onChange={(e) => setCreateText(e.target.value.slice(0, 60))}
              placeholder="What's on your mind?"
              className="w-full resize-none rounded-lg border border-primary bg-secondary p-3 text-sm text-primary outline-none focus:border-secondary placeholder:text-secondary"
              rows={3}
              maxLength={60}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-secondary">{createText.length}/60</span>
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={!createText.trim() || loading}
                className="rounded-lg bg-[#0095f6] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#1877f2] transition-colors"
              >
                {loading ? "Posting..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NotesBar;
