import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { createNote, deleteNote, getMyNotes, getUserNotes } from "../../api/notesApi";
import { getAvatarUrl } from "../../utils/avatar";

function ProfileNote({ user, isOwnProfile }) {
  const [note, setNote] = useState(null);
  const [text, setText] = useState("");
  const [audience] = useState("FOLLOWERS");
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const displayName = user?.username || user?.fullName || "Instagram user";

  const loadNote = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const notes = isOwnProfile ? await getMyNotes() : await getUserNotes(user.id);
      const firstNote = Array.isArray(notes) ? notes[0] : null;
      setNote(firstNote || null);
      setText("");
    } catch {  setNote(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNote();
  }, [user?.id, isOwnProfile]);

  const openNewNote = () => {
    setPreviewOpen(false);
    setText("");
    setEditorOpen(true);
  };

  const handleBubbleClick = (event) => {
    event.stopPropagation();
    if (note) {
      setPreviewOpen(true);
    } else if (isOwnProfile) {
      openNewNote();
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;

    try {
      setSaving(true);
      const savedNote = await createNote({ text: trimmedText, audience, expiryHours: 24 });
      setNote(savedNote);
      setText("");
      setEditorOpen(false);
    } catch {  } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note?.id) return;

    try {
      setSaving(true);
      await deleteNote(note.id);
      setNote(null);
      setText("");
      setPreviewOpen(false);
    } catch {  } finally {
      setSaving(false);
    }
  };

  if (loading || (!note && !isOwnProfile)) return null;

  return (
    <>
      <span className="absolute -top-9 left-1/2 z-20 w-[132px] -translate-x-1/2 sm:-top-10 sm:w-[150px]">
        <span
          role="button"
          tabIndex={0}
          onClick={handleBubbleClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") handleBubbleClick(event);
          }}
          className="block rounded-[18px] border border-primary bg-card px-3 py-2 text-center shadow-sm"
        >
          <span className="block truncate text-[12px] font-semibold text-primary">
            {note?.text || "Share a note"}
          </span>
        </span>
        <span className="mx-auto -mt-[1px] block h-3 w-3 rotate-45 border-b border-r border-primary bg-card" />
      </span>

      {editorOpen && (
        <div className="fixed inset-0 z-[90000] flex items-center justify-center bg-black/50 px-4" onMouseDown={() => setEditorOpen(false)}>
          <form onSubmit={handleSave} className="w-full max-w-[430px] overflow-hidden rounded-xl bg-card text-primary" onMouseDown={(event) => event.stopPropagation()}>
            <div className="relative flex h-12 items-center justify-center border-b border-primary">
              <button type="button" onClick={() => setEditorOpen(false)} className="absolute right-4" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold">New note</h2>
              <button type="submit" disabled={saving || !text.trim()} className="absolute left-4 text-sm font-bold text-[#0095f6] disabled:opacity-40">
                Share
              </button>
            </div>

            <div className="px-6 py-7 text-center">
              <img src={getAvatarUrl(user)} alt="" className="mx-auto h-20 w-20 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={120}
                rows={3}
                placeholder="Share a thought..."
                className="mx-auto mt-4 block w-full max-w-[280px] resize-none rounded-[22px] border border-primary px-4 py-3 text-center text-sm outline-none focus:border-secondary"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      {previewOpen && note && (
        <div className="fixed inset-0 z-[90000] flex items-center justify-center bg-black/50 px-4" onMouseDown={() => setPreviewOpen(false)}>
          <div className="w-full max-w-[360px] overflow-hidden rounded-xl bg-card text-center text-primary" onMouseDown={(event) => event.stopPropagation()}>
            <div className="relative px-6 py-7">
              <button type="button" onClick={() => setPreviewOpen(false)} className="absolute right-4 top-4" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <img src={getAvatarUrl(user)} alt="" className="mx-auto h-20 w-20 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
              <p className="mx-auto mt-4 max-w-[260px] whitespace-pre-wrap rounded-[22px] border border-primary px-4 py-3 text-sm [overflow-wrap:anywhere]">
                {note.text}
              </p>
              <p className="mt-4 text-sm font-bold">{displayName}</p>
            </div>
            {isOwnProfile && (
              <>
                <button type="button" onClick={openNewNote} className="block w-full border-t border-primary py-4 text-sm font-bold">
                  Leave a new note
                </button>
                <button type="button" onClick={handleDelete} disabled={saving} className="flex w-full items-center justify-center gap-2 border-t border-primary py-4 text-sm font-bold text-[#ed4956] disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                  Delete note
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileNote;
