import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMeta } from "react-icons/fa6";
import { ArrowLeft } from "lucide-react";
import { registerUser, addAccount } from "../../api/userApi";
import { clearCurrentUserCache } from "../../hooks/useCurrentUser";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAddAccount = location.pathname === "/add-account";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    mobileOrEmail: "",
    password: "",
    fullName: "",
    username: "",
    month: "",
    day: "",
    year: "",
  });

  const validateMobileOrEmail = (value) => {
    if (!value.trim()) return "";
    if (value.includes("@")) {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        return "Enter a valid email address (e.g. abc@gmail.com).";
      }
    } else {
      if (!/^\d{7,15}$/.test(value)) {
        return "Phone number must be 7–15 digits with no letters or spaces.";
      }
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");

    if (name === "mobileOrEmail") {
      setFieldErrors((prev) => ({ ...prev, mobileOrEmail: validateMobileOrEmail(value) }));
    }

    if (name === "password") {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validate = () => {
    if (!formData.mobileOrEmail.trim()) return "Mobile number or email is required.";
    const mobileOrEmailError = validateMobileOrEmail(formData.mobileOrEmail);
    if (mobileOrEmailError) return mobileOrEmailError;
    if (!formData.password || formData.password.length < 6)
      return "Password must be at least 6 characters.";
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/\d/.test(formData.password))
      return "Password must include uppercase, lowercase, and a number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password))
      return "Password must include a special character (e.g. !@#$%^&*).";
    if (!formData.fullName.trim()) return "Full name is required.";
    if (!formData.username.trim()) return "Username is required.";
    if (!/^[a-zA-Z0-9._]{3,30}$/.test(formData.username))
      return "Username must be 3–30 characters (letters, numbers, . and _).";
    if (!formData.month || !formData.day || !formData.year)
      return "Please select your birth date.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const birthDate = `${formData.year}-${String(formData.month).padStart(2, "0")}-${String(formData.day).padStart(2, "0")}`;

      const payload = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        password: formData.password,
        birthDate,
      };

      if (formData.mobileOrEmail.includes("@")) {
        payload.email = formData.mobileOrEmail.trim();
      } else {
        payload.mobileNumber = formData.mobileOrEmail.trim();
      }

      if (isAddAccount) {
        await addAccount(payload);
        navigate("/switch-account", { replace: true });
      } else {
        await registerUser(payload);
        clearCurrentUserCache();
        navigate("/", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-[58px] border border-primary rounded-xl bg-card px-5 text-[17px] outline-none focus:border-[#0095f6] transition-colors text-primary";
  const selectClass = "h-[58px] border border-primary rounded-xl bg-card px-4 text-[15px] text-primary w-full";

  return (
    <div className="min-h-screen bg-secondary flex justify-center">
      <div className="w-full max-w-[620px] px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(isAddAccount ? "/switch-account" : "/login")}
            className="p-2 rounded-full hover:bg-secondary transition-colors text-primary"
            aria-label={isAddAccount ? "Back to switch accounts" : "Back to login"}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <FaMeta size={22} className="text-[#0866ff]" />
            <span className="text-[18px] font-medium text-primary">Meta</span>
          </div>
        </div>

        <h1 className="text-[34px] font-semibold leading-tight mb-3 text-primary">
          Get started on Instagram
        </h1>

        <p className="text-[19px] text-secondary mb-8">
          Sign up to see photos and videos from your friends.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[17px] font-semibold mb-3 text-primary">
              Mobile number or email
            </label>
            <input
              type="text"
              name="mobileOrEmail"
              value={formData.mobileOrEmail}
              onChange={handleChange}
              placeholder="Mobile number or email"
              autoComplete="email"
              className={inputClass}
            />
            {fieldErrors.mobileOrEmail && (
              <p className="mt-1 text-xs text-[#ed4956]">{fieldErrors.mobileOrEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-[17px] font-semibold mb-3 text-primary">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              autoComplete="new-password"
              className={inputClass}
            />
            {formData.password && (
              <div className="mt-2 space-y-1">
                {[
                  { test: formData.password.length >= 6, label: "At least 6 characters" },
                  { test: /[A-Z]/.test(formData.password), label: "Uppercase letter" },
                  { test: /[a-z]/.test(formData.password), label: "Lowercase letter" },
                  { test: /\d/.test(formData.password), label: "Number" },
                  { test: /[!@#$%^&*(),.?":{}|<>_\-]/.test(formData.password), label: "Special character" },
                ].map(({ test, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className={test ? "text-green-500" : "text-secondary"}>
                      {test ? "✓" : "○"}
                    </span>
                    <span className={test ? "text-green-500" : "text-secondary"}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[14px] font-semibold text-primary">Birthday</label>
              <div className="w-6 h-6 border border-secondary rounded-full flex items-center justify-center text-[11px] text-secondary">?</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <select name="month" value={formData.month} onChange={handleChange} className={selectClass}>
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select name="day" value={formData.day} onChange={handleChange} className={selectClass}>
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select name="year" value={formData.year} onChange={handleChange} className={selectClass}>
                <option value="">Year</option>
                {Array.from({ length: 100 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[17px] font-semibold mb-3 text-primary">Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[17px] font-semibold mb-3 text-primary">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              autoComplete="username"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-[#ed4956] text-center text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[58px] bg-[#0866ff] text-white rounded-full text-[18px] font-semibold disabled:opacity-60 hover:bg-[#1877f2] transition-colors"
          >
            {loading ? "Creating account..." : "Submit"}
          </button>
        </form>

        {!isAddAccount && (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full h-[58px] border border-primary bg-card rounded-full mt-5 text-[17px] font-medium text-primary hover:bg-secondary transition-colors"
          >
            I already have an account
          </button>
        )}
      </div>
    </div>
  );
}

export default Register;
