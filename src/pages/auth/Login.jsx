import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import { loginUser } from "../../api/userApi";
import { clearCurrentUserCache } from "../../hooks/useCurrentUser";

function Login() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        mobileOrEmail: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const payload = {
                login: formData.mobileOrEmail,
                password: formData.password,
            };

            await loginUser(payload);
            clearCurrentUserCache();

            alert("Login Successful");

            navigate("/");
        } catch (err) {
            console.error(err);

            setError(
                typeof err.response?.data === "string"
                    ? err.response.data
                    : err.response?.data?.message ||
                    "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#fafafa]">

            <div className="hidden lg:flex flex-1 bg-white border-r border-[#dbdbdb] relative">
                <div className="w-full max-w-[900px] mx-auto px-8 lg:px-16 pt-28 lg:pt-32 pb-12">
                    <div className="absolute top-8 left-8 flex items-center gap-3">

                        <FaInstagram
                            size={80}
                            className="text-[#E4405F]"
                        />

                    </div>

                    <div className="text-center">

                        <h1 className="
                                    text-[20px]
                                    md:text-[26px]
                                    lg:text-[34px]
                                    xl:text-[40px]
                                    leading-[30px]
                                    md:leading-[34px]
                                    lg:leading-[46px]
                                    xl:leading-[50px]
                                    font-light
                                    text-[#262626]
                                    ">

                            See everyday moments from
                            <br />
                            your{" "}

                            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                                close friends
                            </span>

                            .

                        </h1>

                    </div>

                    <div className="mt-16 lg:mt-24 flex justify-center">
                        <img
                            src="/login-hero.png"
                            alt="Hero"
                            className="
                                w-full
                                max-w-[450px]
                                lg:max-w-[600px]
                                xl:max-w-[700px]
                                rounded-3xl
                                shadow-xl
                                "
                        />

                    </div>

                </div>

            </div>

            <div className="w-full lg:w-[720px] flex justify-center px-6 sm:px-8 lg:px-16 pt-24">
                <div className="w-full max-w-[500px] mx-auto">

                    <div className="flex justify-center mb-8 lg:hidden">

                        <FaInstagram
                            size={72}
                            className="text-[#E4405F]"
                        />

                    </div>

                    <h2 className="text-[26px] font-semibold text-[#262626] mb-6">
                        Log into Instagram
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-3"
                    >

                        <input
                            type="text"
                            name="mobileOrEmail"
                            placeholder="Mobile number, username or email"
                            value={formData.mobileOrEmail}
                            onChange={handleChange}
                            required
                            className="
                w-full
                h-[56px]
                rounded-2xl
                border
                border-[#d8dbe0]
                bg-white
                px-5
                text-[15px]
                outline-none
                focus:border-[#0095f6]
              "
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="
                w-full
                h-[56px]
                rounded-2xl
                border
                border-[#d8dbe0]
                bg-white
                px-5
                text-[15px]
                outline-none
                focus:border-[#0095f6]
              "
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="
                w-full
                h-[50px]
                rounded-full
                bg-[#0095f6]
                text-white
                font-semibold
                text-[16px]
                hover:bg-[#1877f2]
                transition
              "
                        >
                            {loading
                                ? "Logging in..."
                                : "Log In"}
                        </button>

                        {error && (
                            <p className="text-red-500 text-center text-sm">
                                {error}
                            </p>
                        )}

                    </form>

                    <button
                        type="button"
                        className="
              w-full
              mt-6
              text-[#262626]
              text-[15px]
              font-medium
            "
                    >
                        Forgot password?
                    </button>

                    <div className="border-t border-[#e5e7eb] my-6"></div>

                    <button
                        type="button"
                        className="
              w-full
              h-[50px]
              rounded-full
              border
              border-[#d8dbe0]
              bg-white
              flex
              items-center
              justify-center
              gap-3
              text-[#1877f2]
              font-semibold
            "
                    >
                        <FaFacebook size={20} />
                        Log in with Facebook
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="
                            w-full
                            h-[50px]
                            rounded-full
                            border
                            border-[#0095f6]
                            text-[#0095f6]
                            font-semibold
                            mt-4
                            bg-white
                            "
                    >
                        Create new account
                    </button>

                    <div className="flex justify-center items-center gap-2 mt-8">

                        <FaMeta
                            size={22}
                            className="text-[#65676B]"
                        />

                        <span className="text-[#65676B] text-[16px]">
                            Meta
                        </span>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;