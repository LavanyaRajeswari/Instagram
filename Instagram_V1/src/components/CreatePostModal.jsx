import { useState } from "react";
import { createPost } from "../api/postsApi";

function CreatePostModal({ onClose, onPostCreated }) {
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = 1;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
      alert("Maximum 10 files allowed");
      return;
    }

    setImages(files);

    const previewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreview(previewUrls);
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
      onClose();

    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data ||
        "Post upload failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">

      <div className="create-modal">

        <div className="modal-header">

          <button
            type="button"
            onClick={onClose}
          >
            ✕
          </button>

          <h3>Create New Post</h3>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Posting..." : "Share"}
          </button>

        </div>

        <form
          className="create-form"
          onSubmit={handleSubmit}
        >

          <div className="upload-box">

            {preview.length > 0 ? (

              <div className="preview-grid">

                {preview.map((src, index) => (

                  <img
                    key={index}
                    src={src}
                    alt={`preview-${index}`}
                  />

                ))}

              </div>

            ) : (

              <p>Select photos to upload</p>

            )}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />

          </div>

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) =>
              setCaption(e.target.value)
            }
            maxLength={2200}
          />

          <small>
            {caption.length}/2200
          </small>

        </form>

      </div>

    </div>
  );
}

export default CreatePostModal;