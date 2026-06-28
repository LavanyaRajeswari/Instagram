import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePostQuery } from "../api/queryHooks";
import PostCard from "../components/PostCard";

function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [localPost, setLocalPost] = useState(null);
  const { data: fetchedPost, isLoading, error } = usePostQuery(postId);
  const post = localPost || fetchedPost;

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-[935px] px-4 py-8">
        <p className="text-center text-sm text-secondary">Loading post...</p>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="mx-auto min-h-screen max-w-[935px] px-4 py-8">
        <p className="text-center text-sm text-[#ed4956]">
          {error?.response?.data?.message || error?.message || "Post not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[935px] px-4 py-8 pb-[82px] md:pb-10">
      <div className="mx-auto max-w-[580px]">
        <PostCard
          post={post}
          onPostUpdated={(updatedPost) => setLocalPost((prev) => ({ ...(prev || post), ...updatedPost }))}
          onPostDeleted={() => navigate("/")}
        />
      </div>
    </main>
  );
}

export default PostPage;
