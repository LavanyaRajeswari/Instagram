import { useState } from "react";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    try {
      setLoading(true);

      // Attempt the request to the user's backend port 8080 first
      const response = await axios.get("http://localhost:8080/api/users").catch((err) => {
        console.warn("Backend 8080 is offline, resolving with local mock user");
        return {
          data: [
            {
              id: 1,
              username: "lavanya",
              fullName: "Lavanya",
              bio: "Living life, coding React, designing components 🌸✨",
              profilePicture: "https://i.pravatar.cc/150?img=5",
            },
            {
              id: 2,
              username: "sam",
              fullName: "Sam",
              bio: "Photography and baking enthusiast 📸🍳",
              profilePicture: "https://i.pravatar.cc/150?img=11",
            }
          ],
        };
      });

      const users = response.data;

      // Find user, or fallback to the input username if simulating
      let user = users.find((u) => u.username?.toLowerCase() === username.toLowerCase());

      if (!user) {
        // If not found in seed lists, we dynamically create a session profile using their inputs!
        user = {
          id: Date.now(),
          username: username.toLowerCase().replace(/\s+/g, ""),
          fullName: username,
          bio: "Welcome to my Instagram clone profile page!",
          profilePicture: "https://i.pravatar.cc/150?img=12",
        };
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
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
    <main className="min-h-screen flex flex-col justify-center items-center gap-2.5 bg-[#fafafa] p-4 select-none" id="login-layout">
      {/* Login Form Wrapper */}
      <div className="w-[350px] bg-white border border-[#dbdbdb] p-10 text-center rounded-sm shadow-sm flex flex-col items-center justify-center" id="login-card">
        <h1 className="font-grand-hotel text-[48px] font-normal leading-none mt-2 mb-8 text-[#262626]">
          Instagram
        </h1>

        <form className="flex flex-col gap-2 w-full" onSubmit={handleLogin} id="login-form">
          <input
            type="text"
            placeholder="Phone number, username, or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#fafafa] border border-[#dbdbdb] p-2.5 rounded text-[12.5px] text-[#262626] focus:outline-none focus:border-gray-400 placeholder-gray-400 transition-colors"
            id="username-input"
          />

          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#fafafa] border border-[#dbdbdb] p-2.5 pr-14 rounded text-[12.5px] text-[#262626] focus:outline-none focus:border-gray-400 placeholder-gray-400 transition-colors"
              id="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[11px] text-[12px] font-semibold text-[#262626] hover:opacity-60 transition-opacity focus:outline-none"
              id="show-password-toggle"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0095f6] text-white py-1.5 rounded-lg font-semibold text-[14px] mt-2.5 transition-colors hover:bg-[#007ccf] active:scale-[0.98] disabled:opacity-45"
            disabled={loading}
            id="submit-login"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-gray-400 text-[12px] font-semibold my-4.5 w-full">
            <span className="flex-grow h-[1px] bg-[#dbdbdb]"></span>
            <p className="m-0 select-none">OR</p>
            <span className="flex-grow h-[1px] bg-[#dbdbdb]"></span>
          </div>

          {/* Facebook login button link */}
          <button
            type="button"
            className="text-[#385185] font-semibold text-[13.5px] flex items-center justify-center gap-2 hover:opacity-80 transition-opacity mt-2 cursor-pointer"
            id="facebook-login-btn"
          >
            Log in with Facebook
          </button>

          <a href="#" className="text-xs text-[#00376b] hover:underline mt-4 tracking-wide text-center" id="forgot-password">
            Forgot password?
          </a>
        </form>
      </div>

      {/* SignUp Banner */}
      <div className="w-[350px] bg-white border border-[#dbdbdb] py-5 px-6 text-center rounded-sm shadow-sm text-[13.5px] text-gray-700 select-none" id="signup-card">
        Don't have an account?{" "}
        <a href="#" className="text-[#0095f6] font-semibold hover:underline" id="signup-link">
          Sign up
        </a>
      </div>
    </main>
  );
}

export default Login;
