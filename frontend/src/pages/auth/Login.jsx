import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaMeta } from "react-icons/fa6";
import { loginUser } from "../../api/userApi";
import { clearCurrentUserCache } from "../../hooks/useCurrentUser";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    mobileOrEmail: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mobileOrEmail.trim()) {
      setError("Please enter your username, email or mobile number.");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await loginUser({ login: formData.mobileOrEmail.trim(), password: formData.password });
      clearCurrentUserCache();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || "Incorrect username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    w-full h-[56px] rounded-2xl border border-primary bg-card px-5 text-[15px]
    outline-none focus:border-[#0095f6] transition-colors text-primary placeholder:text-secondary
  `;

  return (
    <div className="min-h-screen flex bg-secondary">
      <div className="hidden lg:flex flex-1 bg-card border-r border-primary relative overflow-hidden">
        <div className="w-full max-w-[900px] mx-auto px-8 lg:px-16 pt-28 lg:pt-32 pb-12">
          <div className="absolute top-8 left-8">
              <img
                src="/Insta-icon.png"
                alt="Instagram"
                className="w-20 h-20 object-contain"
              />
            </div>

          <div className="text-center">
            <h1 className="text-[20px] md:text-[26px] lg:text-[34px] xl:text-[40px] leading-[30px] md:leading-[34px] lg:leading-[46px] xl:leading-[50px] font-light text-primary">
              See everyday moments from
              <br />
              your{" "}
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                close friends
              </span>
              .
            </h1>
          </div>

          <div className="mt-8 lg:mt-6 flex justify-center">
            <img
              src="/login-hero.png"
              alt="Hero"
              className="w-full max-w-[450px] lg:max-w-[600px] xl:max-w-[700px] rounded-3xl shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[720px] flex items-center justify-center px-6 sm:px-8 lg:px-16">
        <div className="w-full max-w-[500px] mx-auto">
          <div className="flex justify-center mb-8 lg:hidden">
            <img
              src="/Insta-icon.png"
              alt="Instagram"
              className="w-18 h-18 object-contain"
            />
          </div>

          <h2 className="text-[26px] font-semibold text-primary mb-6">
            Log into Instagram
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              name="mobileOrEmail"
              placeholder="Mobile number, username or email"
              value={formData.mobileOrEmail}
              onChange={handleChange}
              autoComplete="username"
              className={inputClass}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className={inputClass}
            />

            {error && (
              <p className="text-[#ed4956] text-center text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-full bg-[#0095f6] text-white font-semibold text-[16px] hover:bg-[#1877f2] transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="border-t border-secondary my-6" />

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full h-[50px] rounded-full border border-[#0095f6] text-[#0095f6] font-semibold bg-card hover:bg-[#e8f0fe] transition-colors"
          >
            Create new account
          </button>

          <div className="flex justify-center items-center gap-2 mt-8">
            <FaMeta size={22} className="text-[#65676B]" />
            <span className="text-[#65676B] text-[16px]">Meta</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Login;
