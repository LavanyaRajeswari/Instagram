import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import { getPosts } from "../api/postsApi";

function Home() {
  const [posts, setPosts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
  try {

    setLoading(true);

    const data = await getPosts();

    console.log("Backend Posts:", data);

    setPosts(data);

  } catch (error) {

    console.error("Failed to load posts", error);
    setPosts([]);

  } finally {

    setLoading(false);

  }
};

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      <Sidebar onCreateClick={() => setCreateOpen(true)} />

      <main className="main-layout">
        {/* Feed */}
        <section className="feed-column">
          <div className="stories-bar">
            {[
              "Your Story",
              "lavanya",
              "sam",
              "mountblue",
              "java_dev",
            ].map((name, index) => (
              <div className="story" key={name}>
                <img
                  src={`https://i.pravatar.cc/100?img=${index + 10}`}
                  alt={name}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>

          {loading && (
            <p className="center-text">
              Loading posts...
            </p>
          )}

          {!loading && posts.length === 0 && (
            <p className="center-text">
              No posts found
            </p>
          )}

          {!loading &&
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onRefresh={loadPosts}
              />
            ))}
        </section>

        {/* Right Sidebar */}
        <aside className="suggestions">
          <div className="my-profile">
            <img
              src="https://i.pravatar.cc/100?img=5"
              alt="profile"
            />
            <div>
              <h4>Lavanya</h4>
              <p>@lavanya</p>
            </div>
          </div>

          <h4 className="suggest-title">
            Suggestions for you
          </h4>

          {[
            "springboot_dev",
            "react_ui",
            "cloudinary_app",
          ].map((user, i) => (
            <div className="suggest-user" key={user}>
              <img
                src={`https://i.pravatar.cc/100?img=${i + 20}`}
                alt={user}
              />
              <div>
                <h5>{user}</h5>
                <p>Suggested for you</p>
              </div>
              <button>Follow</button>
            </div>
          ))}
        </aside>
      </main>

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => {
            setCreateOpen(false);
            loadPosts();
          }}
        />
      )}
    </div>
  );
}

export default Home;