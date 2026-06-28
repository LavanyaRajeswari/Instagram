import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, ArrowLeft, Trash2, RotateCcw, ChevronLeft } from "lucide-react";
import { getArchivedStories, deleteArchivedStory, restoreArchivedStory } from "../api/storiesApi";

function groupByMonth(items) {
  const groups = {};
  for (const item of items) {
    const d = new Date(item.archivedAt || item.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { year: "numeric", month: "long" }), items: [] };
    groups[key].items.push(item);
  }
  return Object.values(groups).sort((a, b) => b.year - a.year || b.month - a.month);
}

function ArchivePage() {
  const navigate = useNavigate();
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    try {
      const data = await getArchivedStories();
      setArchived(Array.isArray(data) ? data : []);
    } catch {
      setArchived([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id) => {
    try {
      await restoreArchivedStory(id);
      setArchived((prev) => prev.filter((a) => a.id !== id));
      setViewing(null);
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteArchivedStory(id);
      setArchived((prev) => prev.filter((a) => a.id !== id));
      setViewing(null);
    } catch {}
  };

  if (viewing) {
    return (
      <main className="fixed inset-0 z-[900] flex flex-col bg-black">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => setViewing(null)} className="text-white">
            <ChevronLeft size={28} />
          </button>
          <p className="text-sm font-semibold text-white">Archived Story</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          {viewing.mediaUrl && (
            viewing.mediaType === "video" ? (
              <video src={viewing.mediaUrl} className="max-h-[80vh] max-w-full" controls autoPlay playsInline />
            ) : (
              <img src={viewing.mediaUrl} alt="" className="max-h-[80vh] max-w-full object-contain" />
            )
          )}
        </div>
        <div className="flex items-center justify-center gap-6 p-6">
          <button onClick={() => handleRestore(viewing.id)} className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20">
            <RotateCcw size={18} /> Restore
          </button>
          <button onClick={() => handleDelete(viewing.id)} className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-[#ed4956] hover:bg-white/20">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[600px] bg-card px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center text-primary hover:text-secondary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-primary">Archive</h1>
      </div>
      {loading ? (
        <p className="py-16 text-center text-sm text-secondary">Loading archived stories...</p>
      ) : archived.length === 0 ? (
        <div className="py-16 text-center">
          <Archive className="mx-auto h-12 w-12 text-secondary" />
          <p className="mt-4 text-lg font-bold text-primary">No Archived Stories</p>
          <p className="mt-2 text-sm text-secondary">Your archived stories will appear here.</p>
        </div>
      ) : (
        <div>
          {groupByMonth(archived).map((group) => (
            <div key={group.label} className="mb-8">
              <h2 className="mb-4 text-lg font-bold text-primary">{group.label}</h2>
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setViewing(item)}
                    className="relative aspect-square overflow-hidden rounded bg-tertiary"
                  >
                    {item.mediaUrl ? (
                      item.mediaType === "video" ? (
                        <video src={item.mediaUrl} muted playsInline className="h-full w-full object-cover" />
                      ) : (
                        <img src={item.mediaUrl} alt="" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-secondary text-sm">No media</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default ArchivePage;
