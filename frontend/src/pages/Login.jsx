import { useState } from "react";
import axios from "axios";

function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const response = await axios.get(
        "http://localhost:8080/api/users"
      );

      const users = response.data;

      const user = users.find(
        (u) =>
          u.username === username
      );

      if (!user) {
        alert("User not found");
        return;
      }

      localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
      );

      alert("Login successful");

      window.location.href = "/";

    } catch (error) {

      console.error(error);

      alert("Login failed");

    } finally {

      setLoading(false);

    }
  };

  return (
    <main className="login-page">

      <div className="login-card">

        <h1 className="login-logo">
          Instagram
        </h1>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />

          <div className="password-field">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>

          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Log in"}

          </button>

          <div className="divider">

            <span></span>

            <p>OR</p>

            <span></span>

          </div>

          <button
            type="button"
            className="facebook-login"
          >
            Log in with Facebook
          </button>

          <a href="#">
            Forgot password?
          </a>

        </form>

      </div>

      <div className="signup-card">

        Don't have an account?

        <a href="/register">
          Sign up
        </a>

      </div>

    </main>
  );
}

export default Login;