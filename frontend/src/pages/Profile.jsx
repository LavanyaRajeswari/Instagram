import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

function Profile() {

  const currentUser =
    JSON.parse(
      localStorage.getItem("currentUser")
    );

  const CURRENT_USER_ID =
    currentUser?.id;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    try {

      const userResponse = await axios.get(
        `http://localhost:8080/api/users/${CURRENT_USER_ID}`
      );

      const postsResponse = await axios.get(
        "http://localhost:8080/api/posts"
      );

      const userPosts = postsResponse.data.filter(
        (post) => post.user?.id === CURRENT_USER_ID
      );

      setUser(userResponse.data);
      setPosts(userPosts);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <h2 style={{ textAlign: "center" }}>
          Loading profile...
        </h2>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />

      <main className="profile-page">

        <header className="profile-header">

          <img
            className="profile-photo"
            src={
              user?.profilePicture ||
              "https://i.pravatar.cc/200?img=32"
            }
            alt="profile"
          />

          <div className="profile-info">

            <div className="profile-top">

              <h2>
                {user?.username}
              </h2>

              <button>
                Edit profile
              </button>

              <button>
                View archive
              </button>

              <button>
                ⚙
              </button>

            </div>

            <div className="profile-stats">

              <p>
                <strong>
                  {posts.length}
                </strong>{" "}
                posts
              </p>

              <p>
                <strong>0</strong>
                {" "}followers
              </p>

              <p>
                <strong>0</strong>
                {" "}following
              </p>

            </div>

            <div className="bio">

              <h4>
                {user?.fullName}
              </h4>

              <p>
                {user?.bio}
              </p>

            </div>

          </div>

        </header>

        <div className="profile-tabs">

          <button>
            ▦ POSTS
          </button>

          <button>
            SAVED
          </button>

          <button>
            👤 TAGGED
          </button>

        </div>

        <section className="profile-grid">

          {posts.length === 0 ? (

            <p>
              No posts yet
            </p>

          ) : (

            posts.map((post) => {

              const image =
                post.media?.[0]?.mediaUrl ||
                "https://via.placeholder.com/300";

              return (

                <img
                  key={post.id}
                  src={image}
                  alt="post"
                />

              );
            })

          )}

        </section>

      </main>

    </div>
  );
}

export default Profile;