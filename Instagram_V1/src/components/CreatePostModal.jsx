import { useState, useRef } from "react";
import { createPost } from "../api/postsApi";
import { X, Image as ImageIcon, UploadCloud } from "lucide-react";

function CreatePostModal({ onClose, onPostCreated }) {
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const activeUser = JSON.parse(
    localStorage.getItem("currentUser") ||
      '{"id":1,"username":"lavanya","fullName":"Lavanya","profilePicture":"https://i.pravatar.cc/100?img=5"}'
  );
  const userId = activeUser?.id || 1;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 10) {
      alert("Maximum 10 files allowed");
      return;
    }

    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const getErrorMessage = (error) => {
    const data = error?.response?.data;

    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return error.message || "Post upload failed";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      alert("Please select at least one image");
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
      setImages([]);
      setPreview([]);

      onPostCreated();
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] p-4 animate-fade-in" id="create-modal-backdrop">
      <div 
        className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-[500px] flex flex-col max-h-[90vh] animate-scale-up"
        id="create-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3.5 border-b border-[#dbdbdb] bg-white">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-[#262626] hover:opacity-70 transition-all font-semibold p-1"
            id="close-create-modal"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="m-0 text-[16px] font-semibold text-[#262626]" id="create-modal-title">
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

        {/* Content & Scroll Area */}
        <form className="p-5 flex flex-col gap-4 overflow-y-auto" onSubmit={handleSubmit} id="create-post-form">
          {/* Upload Area */}
          <div 
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              preview.length > 0 ? "border-solid border-transparent p-1 bg-gray-50" : "border-[#dbdbdb] hover:border-gray-400 hover:bg-gray-50/50"
            }`}
            id="upload-holder"
          >
            {preview.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 w-full" id="images-preview-grid">
                {preview.map((src, index) => (
                  <div key={index} className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-100">
                    <img src={src} alt={`preview-${index}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 my-2" id="empty-upload-view">
                <UploadCloud className="w-12 h-12 text-gray-400 mb-2 stroke-[1.5]" />
                <p className="text-[14px] text-gray-700 font-medium my-0">Drag photos and videos here</p>
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
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
              id="file-upload-input"
            />
          </div>

          {/* Caption Field */}
          <div className="flex flex-col gap-1 w-full" id="caption-wrapper">
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={4}
              className="w-full border border-[#dbdbdb] rounded-lg p-3 text-[14px] leading-relaxed focus:outline-none focus:border-gray-400 transition-colors resize-none"
              id="caption-textarea"
            />
            <div className="flex justify-end mt-1 text-right">
              <span className="text-[11px] text-gray-400 font-mono" id="caption-character-count">
                {caption.length} / 2200
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;
