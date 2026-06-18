import { useState } from "react";
import { deletePost, updatePost } from "../api/postsApi";
import { likePost, unlikePost } from "../api/likesApi";
import { addComment } from "../api/commentsApi";

import {
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiBookmark,
} from "react-icons/fi";

function PostCard({ post, onRefresh }) {

  const CURRENT_USER_ID = 1;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [caption, setCaption] =
    useState(post.caption || "");

  const [liked, setLiked] =
    useState(false);

  const [likes, setLikes] =
    useState(post.likeCount || 0);

  const [commentText, setCommentText] =
    useState("");

  const image =
    post.imageUrls?.[0] ||
    "https://via.placeholder.com/500";

  const handleDelete = async () => {

    if (!window.confirm("Delete this post?"))
      return;

    try {

      await deletePost(post.id);

      onRefresh();

    } catch (error) {

      console.error(error);
      alert("Delete failed");

    }
  };

  const handleUpdate = async () => {

    try {

      await updatePost({
        postId: post.id,
        caption,
        images: [],
      });

      setEditing(false);

      onRefresh();

    } catch (error) {

      console.error(error);
      alert("Update failed");

    }
  };

  const handleLike = async () => {

    try {

      if (!liked) {

        await likePost(
          post.id,
          CURRENT_USER_ID
        );

        setLiked(true);
        setLikes((prev) => prev + 1);

      } else {

        await unlikePost(
          post.id,
          CURRENT_USER_ID
        );

        setLiked(false);

        setLikes((prev) =>
          Math.max(prev - 1, 0)
        );
      }

    } catch (error) {

      console.error(error);
      alert("Like action failed");

    }
  };

  const handleComment = async () => {

    if (!commentText.trim()) return;

    try {

      await addComment(
        post.id,
        CURRENT_USER_ID,
        commentText
      );

      setCommentText("");

      alert("Comment added");

    } catch (error) {

      console.error(error);
      alert("Comment failed");

    }
  };

  return (
    <article className="post-card">

      <div className="post-header">

        <div className="post-user">

          <img
            src={
              post.profilePicture ||
              "https://i.pravatar.cc/100?img=12"
            }
            alt="profile"
            className="avatar"
          />

          <div>
            <h4>{post.username}</h4>
            <p>Original audio</p>
          </div>

        </div>

        <div className="post-menu">

          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
          >
            ⋯
          </button>

          {menuOpen && (

            <div className="menu-dropdown">

              <button
                onClick={() =>
                  setEditing(true)
                }
              >
                Edit
              </button>

              <button
                className="danger"
                onClick={handleDelete}
              >
                Delete
              </button>

            </div>

          )}

        </div>

      </div>

      <img
        src={image}
        alt="post"
        className="post-image"
      />

      <div className="post-actions">

        <div className="left-actions">

          <button
            className={`action-btn ${
              liked ? "liked" : ""
            }`}
            onClick={handleLike}
          >
            <FiHeart />
          </button>

          <button className="action-btn">
            <FiMessageCircle />
          </button>

          <button className="action-btn">
            <FiSend />
          </button>

        </div>

        <button className="action-btn">
          <FiBookmark />
        </button>

      </div>

      <div className="post-content">

        <p className="likes">
          {likes} likes
        </p>

        {editing ? (

          <div className="edit-box">

            <textarea
              value={caption}
              onChange={(e) =>
                setCaption(
                  e.target.value
                )
              }
            />

            <div>

              <button
                onClick={handleUpdate}
              >
                Save
              </button>

              <button
                onClick={() =>
                  setEditing(false)
                }
              >
                Cancel
              </button>

            </div>

          </div>

        ) : (

          <p>
            <strong>
              {post.username}
            </strong>{" "}
            {post.caption}
          </p>

        )}

        <p className="time">

          {post.createdAt
            ? new Date(
                post.createdAt
              ).toLocaleString()
            : "Just now"}

        </p>

      </div>

      <div className="comment-box">

        <input
          value={commentText}
          onChange={(e) =>
            setCommentText(
              e.target.value
            )
          }
          placeholder="Add a comment..."
        />

        <button
          onClick={handleComment}
        >
          Post
        </button>

      </div>

    </article>
  );
}

export default PostCard;