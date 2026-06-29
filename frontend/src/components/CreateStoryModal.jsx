import { useRef, useState, useEffect, useCallback } from "react";
import { Music, X, Search, Play, Pause, TrendingUp, Check, Loader } from "lucide-react";
import { createStory, getStoryMusic, searchStoryMusic, setStoryMusic } from "../api/storiesApi";
import { useCurrentUser } from "../hooks/useCurrentUser";
import MentionSuggestions from "./MentionSuggestions";

function CreateStoryModal({ onClose, onStoryCreated }) {
  const { currentUserId } = useCurrentUser();
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Songs state
  const [allSongs, setAllSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  const captionRef = useRef(null);
  const audioRef = useRef(null);
  const searchTimerRef = useRef(null);

  const mentionMatch = caption
    .slice(0, captionRef.current?.selectionStart ?? caption.length)
    .match(/@([A-Za-z0-9_]*)$/);
  const mentionQuery = mentionMatch ? mentionMatch[1] : "";

  // Pre-load all songs when modal mounts
  useEffect(() => {
    setSongsLoading(true);
    getStoryMusic()
      .then((songs) => {
        setAllSongs(songs);
        setFilteredSongs(songs);
      })
      .catch(() => {
        setAllSongs([]);
        setFilteredSongs([]);
      })
      .finally(() => setSongsLoading(false));
  }, []);

  // Audio element setup
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const handleEnded = () => setPlayingId(null);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMedia(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      clearTimeout(searchTimerRef.current);
      if (!query.trim()) {
        setFilteredSongs(allSongs);
        return;
      }
      setSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchStoryMusic(query.trim());
          setFilteredSongs(
            results.length > 0
              ? results
              : allSongs.filter(
                  (s) =>
                    s.title?.toLowerCase().includes(query.toLowerCase()) ||
                    s.artist?.toLowerCase().includes(query.toLowerCase())
                )
          );
        } catch {
          setFilteredSongs(
            allSongs.filter(
              (s) =>
                s.title?.toLowerCase().includes(query.toLowerCase()) ||
                s.artist?.toLowerCase().includes(query.toLowerCase())
            )
          );
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [allSongs]
  );

  const togglePreview = (song) => {
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = song.audioUrl;
        audioRef.current.play().catch(() => {});
      }
      setPlayingId(song.id);
    }
  };

  const handleSelectMusic = (song) => {
    setSelectedMusic((prev) => (prev?.id === song.id ? null : song));
  };

  const handleSubmit = async () => {
    if (!media || !currentUserId) return;
    try {
      setLoading(true);
      audioRef.current?.pause();
      const story = await createStory({ userId: currentUserId, caption, media });
      if (selectedMusic?.id && story?.id) {
        await setStoryMusic(story.id, selectedMusic.id);
      }
      await onStoryCreated?.();
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const insertMention = (user) => {
    const input = captionRef.current;
    const cursor = input?.selectionStart ?? caption.length;
    const beforeCursor = caption
      .slice(0, cursor)
      .replace(/@([A-Za-z0-9_]*)$/, `@${user.username} `);
    setCaption(`${beforeCursor}${caption.slice(cursor)}`);
    requestAnimationFrame(() => {
      captionRef.current?.focus();
      captionRef.current?.setSelectionRange(beforeCursor.length, beforeCursor.length);
    });
  };

  const isVideo = media?.type?.startsWith("video");

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-xl bg-card">
        {/* Header */}
        <div className="relative flex h-12 items-center justify-center border-b">
          <h2 className="text-sm font-semibold">Create story</h2>
          <button type="button" onClick={onClose} className="absolute right-4">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[85vh] overflow-y-auto p-4">
          {/* Media preview / picker */}
          {preview ? (
            isVideo ? (
              <video
                src={preview}
                controls
                className="h-[240px] w-full rounded-lg bg-black object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="h-[240px] w-full rounded-lg bg-black object-contain"
              />
            )
          ) : (
            <label className="flex h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary text-sm text-secondary hover:bg-secondary/10">
              <Music className="h-8 w-8 opacity-40" />
              <span>Select photo or video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>
          )}

          {/* Music picker — always visible, pre-loaded */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Music className="h-4 w-4" />
                Add music
              </div>
              {selectedMusic && (
                <button
                  type="button"
                  onClick={() => setSelectedMusic(null)}
                  className="text-xs text-secondary hover:text-primary"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Selected song pill */}
            {selectedMusic && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#0095f6]/10 px-3 py-2 text-sm">
                <Music className="h-4 w-4 shrink-0 text-[#0095f6]" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{selectedMusic.title}</span>
                  <span className="block truncate text-xs text-secondary">
                    {selectedMusic.artist}
                  </span>
                </span>
              </div>
            )}

            {/* Search input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search songs or artists..."
                className="w-full rounded-lg border border-primary bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0095f6]"
                disabled={songsLoading}
              />
              {searching && (
                <Loader className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-secondary" />
              )}
            </div>

            {/* Songs list */}
            <div className="max-h-52 overflow-y-auto rounded-lg border border-primary">
              {songsLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-secondary">
                  <Loader className="h-5 w-5 animate-spin text-[#0095f6]" />
                  <span>Loading songs...</span>
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="py-6 text-center text-xs text-secondary">
                  {searchQuery ? `No results for "${searchQuery}"` : "No songs available"}
                </div>
              ) : (
                filteredSongs.map((song) => {
                  const isSelected = selectedMusic?.id === song.id;
                  const isPlaying = playingId === song.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => handleSelectMusic(song)}
                      className={`flex cursor-pointer items-center gap-3 border-b border-secondary px-3 py-2 last:border-b-0 hover:bg-secondary/30 ${
                        isSelected ? "bg-[#0095f6]/10" : ""
                      }`}
                    >
                      {/* Play/pause button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreview(song);
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/40 hover:bg-secondary/70"
                      >
                        {isPlaying ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Title + artist */}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                          {song.title}
                          {song.isTrending && (
                            <TrendingUp className="h-3 w-3 shrink-0 text-[#0095f6]" />
                          )}
                        </span>
                        <span className="block truncate text-xs text-secondary">{song.artist}</span>
                      </span>

                      {/* Selected indicator */}
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-[#0095f6]" />}
                    </div>
                  );
                })
              )}
            </div>
            {!songsLoading && filteredSongs.length > 0 && (
              <p className="mt-1 text-right text-xs text-secondary">{filteredSongs.length} songs</p>
            )}
          </div>

          {/* Caption */}
          {preview && (
            <div className="relative mt-3">
              <input
                ref={captionRef}
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              />
              <MentionSuggestions
                query={mentionQuery}
                active={Boolean(mentionMatch)}
                onSelect={insertMention}
              />
            </div>
          )}

          {/* Share button */}
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
