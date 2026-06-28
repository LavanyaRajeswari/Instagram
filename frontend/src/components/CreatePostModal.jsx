import { useEffect, useState, useRef } from "react";
import { createPost } from "../api/postsApi";
import EmojiPicker from "emoji-picker-react";
import { Smile, X, UploadCloud } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import MentionSuggestions from "./MentionSuggestions";

function CreatePostModal({ onClose, onPostCreated }) {
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);
  const captionRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { currentUserId: userId, currentUserLoading } = useCurrentUser();

  const mentionMatch = caption.slice(0, captionRef.current?.selectionStart ?? caption.length).match(/@([A-Za-z0-9_]*)$/);
  const mentionQuery = mentionMatch ? mentionMatch[1] : "";

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 10) {
     
      return;
    }

    preview.forEach((item) => URL.revokeObjectURL(item.url));
    setImages(files);
    setPreview(files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    })));
  };

  useEffect(() => {
    return () => {
      preview.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [preview]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        emojiOpen &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [emojiOpen]);

  const getErrorMessage = (error) => {
    const data = error?.response?.data;

    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return error.message || "Post upload failed";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (images.length === 0) {
      setSubmitError("Please select at least one photo or video.");
      return;
    }

    if (!userId || currentUserLoading) {
      return;
    }

    try {
      setLoading(true);

      await createPost({
        userId,
        caption,
        images,
      });

      setCaption("");
      setEmojiOpen(false);
      setImages([]);
      preview.forEach((item) => URL.revokeObjectURL(item.url));
      setPreview([]);

      onPostCreated?.();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleEmojiSelect = (emojiData) => {
    const emoji = emojiData?.emoji || "";
    if (!emoji) return;

    const input = captionRef.current;
    const start = input?.selectionStart ?? caption.length;
    const end = input?.selectionEnd ?? caption.length;

    setCaption((prev) => `${prev.slice(0, start)}${emoji}${prev.slice(end)}`);
    setEmojiOpen(false);

    requestAnimationFrame(() => {
      const cursorPosition = start + emoji.length;
      captionRef.current?.focus();
      captionRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const insertMention = (user) => {
    const input = captionRef.current;
    const cursor = input?.selectionStart ?? caption.length;
    const beforeCursor = caption.slice(0, cursor).replace(/@([A-Za-z0-9_]*)$/, `@${user.username} `);
    const nextCaption = `${beforeCursor}${caption.slice(cursor)}`;
    setCaption(nextCaption);
    requestAnimationFrame(() => {
      captionRef.current?.focus();
      captionRef.current?.setSelectionRange(beforeCursor.length, beforeCursor.length);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] p-4 animate-fade-in" id="create-modal-backdrop">
      <div 
        className="bg-card rounded-xl shadow-xl overflow-hidden w-full max-w-[500px] flex flex-col max-h-[90vh] animate-scale-up"
        id="create-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-3.5 border-b border-primary bg-card">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-primary hover:opacity-70 transition-all font-semibold p-1"
            id="close-create-modal"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="m-0 text-[16px] font-semibold text-primary" id="create-modal-title">
            Create New Post
          </h3>

          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading || images.length === 0} 
            className="text-[#0095f6] hover:text-[#005f9e] font-semibold text-[14px] disabled:opacity-40 transition-colors cursor-pointer"
            id="submit-create-post"
          >
            {loading ? "Posting..." : "Share"}
          </button>
        </div>

        <form className="p-5 flex flex-col gap-4 overflow-y-auto" onSubmit={handleSubmit} id="create-post-form">
          <div 
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              preview.length > 0 ? "border-solid border-transparent p-1 bg-secondary" : "border-primary hover:border-secondary hover:bg-secondary/50"
            }`}
            id="upload-holder"
          >
            {preview.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 w-full" id="images-preview-grid">
                {preview.map((item, index) => (
                  <div key={index} className="relative aspect-square w-full rounded-lg overflow-hidden border border-secondary">
                    {item.type.startsWith("video/") ? (
                      <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={item.url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 my-2" id="empty-upload-view">
                <UploadCloud className="w-12 h-12 text-secondary mb-2 stroke-[1.5]" />
                <p className="text-[14px] text-primary font-medium my-0">Drag photos and videos here</p>
                <button 
                  type="button" 
                  className="mt-4 px-4 py-2 bg-[#0095f6] text-white font-medium text-xs rounded-lg hover:bg-[#007ccf] active:scale-95 transition-all shadow-sm"
                >
                  Select from computer
                </button>
              </div>
            )}

            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
              id="file-upload-input"
            />
          </div>

          <div className="flex flex-col gap-1 w-full" id="caption-wrapper">
            <div className="relative">
              <textarea
                ref={captionRef}
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                rows={4}
                className="w-full border border-primary rounded-lg p-3 pr-11 text-[14px] leading-relaxed focus:outline-none focus:border-secondary transition-colors resize-none"
                id="caption-textarea"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setEmojiOpen((prev) => !prev);
                }}
                className="absolute bottom-3 right-3 text-secondary hover:text-primary"
                aria-label="Add emoji"
              >
                <Smile className="h-5 w-5" />
              </button>

              {emojiOpen && (
                <div
                  ref={emojiPickerRef}
                  className="absolute right-0 top-full z-[120] mt-1 max-h-[260px] overflow-y-auto rounded-xl border border-primary bg-card p-1 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    width={270}
                    height={250}
                    theme="light"
                    skinTonesDisabled={true}
                    searchDisabled={true}
                    emojiStyle="native"
                    previewConfig={{
                      showPreview: false,
                    }}
                  />
                </div>
              )}
              <MentionSuggestions query={mentionQuery} active={Boolean(mentionMatch)} onSelect={insertMention} />
            </div>
            <div className="flex justify-end mt-1 text-right">
              <span className="text-[11px] text-secondary font-mono" id="caption-character-count">
                {caption.length} / 2200
              </span>
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-[#ed4956] text-center py-1">{submitError}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;
