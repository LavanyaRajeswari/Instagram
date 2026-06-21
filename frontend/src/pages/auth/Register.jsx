import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/userApi";
import { FiChevronLeft } from "react-icons/fi";
import { FaMeta } from "react-icons/fa6";
import { clearCurrentUserCache } from "../../hooks/useCurrentUser";

function Register() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        mobileOrEmail: "",
        password: "",
        fullName: "",
        username: "",
        month: "",
        day: "",
        year: "",
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (
            !formData.month ||
            !formData.day ||
            !formData.year
        ) {
            alert("Please select your birth date");
            return;
        }

        try {

            setLoading(true);

            const birthDate = `${formData.year}-${String(formData.month).padStart(2, "0")}-${String(formData.day).padStart(2, "0")}`;

            const payload = {
                username: formData.username,
                fullName: formData.fullName,
                password: formData.password,
                birthDate: birthDate,
            };

            if (formData.mobileOrEmail.includes("@")) {
                payload.email = formData.mobileOrEmail;
            } else {
                payload.mobileNumber = formData.mobileOrEmail;
            }

            console.log(payload);

            const user = await registerUser(payload);

            if (user?.token) {
                localStorage.setItem("authToken", user.token);
                clearCurrentUserCache();
            }

            alert("Registration successful");

            navigate("/");

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data ||
                "Registration failed"
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="min-h-screen bg-[#f2f2f2] flex justify-center">

            <div className="w-full max-w-[620px] px-4 py-8">

                <button
                    type="button"
                    className="mb-5"
                >
                    <FiChevronLeft size={34} />
                </button>

                <div className="flex items-center gap-1 mb-4">
                    <FaMeta
                        size={22}
                        className="text-[#0866ff]"
                    />
                    <span className="text-[18px] font-medium">
                        Meta
                    </span>
                </div>

                <h1 className="text-[34px] font-semibold leading-tight mb-3">
                    Get started on Instagram
                </h1>

                <p className="text-[19px] text-[#1c1e21] mb-8">
                    Sign up to see photos and videos from your friends.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <div>

                        <label className="block text-[17px] font-semibold mb-3">
                            Mobile number or email
                        </label>

                        <input
                            type="text"
                            name="mobileOrEmail"
                            value={formData.mobileOrEmail}
                            onChange={handleChange}
                            placeholder="Mobile number or email"
                            required
                            className="w-full h-[58px] border border-[#ccd0d5] rounded-xl bg-white px-5 text-[17px] outline-none"
                        />

                    </div>

                    <p className="text-[15px] text-[#606770] leading-5">
                        You may receive notifications from us.
                        <span className="text-[#0866ff] font-medium">
                            {" "}Learn why we ask for your contact information
                        </span>
                    </p>

                    <div>

                        <label className="block text-[17px] font-semibold mb-3">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            required
                            className="w-full h-[58px] border border-[#ccd0d5] rounded-xl bg-white px-5 text-[17px] outline-none"
                        />

                    </div>

                    <div>

                        <div className="flex items-center gap-2 mb-2">

                            <label className="text-[14px] font-semibold">
                                Birthday
                            </label>

                            <div className="w-6 h-6 border border-gray-400 rounded-full flex items-center justify-center text-[11px]">
                                ?
                            </div>

                        </div>

                        <div className="grid grid-cols-3 gap-3">

                            <select
                                name="month"
                                value={formData.month}
                                onChange={handleChange}
                                className="h-[58px] border border-[#ccd0d5] rounded-xl bg-white px-4 text-[17px]"
                            >
                                <option value="">
                                    Month
                                </option>

                                {Array.from({ length: 12 }, (_, i) => (
                                    <option
                                        key={i + 1}
                                        value={i + 1}
                                    >
                                        {i + 1}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="day"
                                value={formData.day}
                                onChange={handleChange}
                                className="h-[54px] border border-[#ccd0d5] rounded-xl bg-white px-4 text-[15px]"
                            >
                                <option value="">
                                    Day
                                </option>

                                {Array.from({ length: 31 }, (_, i) => (
                                    <option
                                        key={i + 1}
                                        value={i + 1}
                                    >
                                        {i + 1}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="h-[54px] border border-[#ccd0d5] rounded-xl bg-white px-4 text-[15px]"
                            >
                                <option value="">
                                    Year
                                </option>

                                {Array.from({ length: 100 }, (_, i) => (
                                    <option
                                        key={2025 - i}
                                        value={2025 - i}
                                    >
                                        {2025 - i}
                                    </option>
                                ))}
                            </select>

                        </div>

                    </div>

                    <div>

                        <label className="block text-[17px] font-semibold mb-3">
                            Name
                        </label>

                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Full name"
                            required
                            className="w-full h-[58px] border border-[#ccd0d5] rounded-xl bg-white px-5 text-[17px] outline-none"
                        />

                    </div>

                    <div>

                        <label className="block text-[17px] font-semibold mb-3">
                            Username
                        </label>

                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Username"
                            required
                            className="w-full h-[58px] border border-[#ccd0d5] rounded-xl bg-white px-5 text-[17px] outline-none"
                        />

                    </div>

                    <div className="space-y-4 pt-1">

                        <p className="text-[15px] text-[#1c1e21] leading-5">
                            People who use our service may have uploaded your
                            contact information to Instagram.
                            <span className="text-[#0866ff] font-medium">
                                {" "}Learn more.
                            </span>
                        </p>

                        <p className="text-[15px] text-[#1c1e21] leading-5">
                            By tapping Submit, you agree to create an account
                            and to Instagram's
                            <span className="text-[#0866ff] font-medium">
                                {" "}Terms
                            </span>,
                            <span className="text-[#0866ff] font-medium">
                                {" "}Privacy Policy
                            </span>
                            and
                            <span className="text-[#0866ff] font-medium">
                                {" "}Cookies Policy
                            </span>.
                        </p>

                        <p className="text-[15px] text-[#1c1e21] leading-5">
                            The
                            <span className="text-[#0866ff] font-medium">
                                {" "}Privacy Policy
                            </span>
                            describes the ways we can use the information we
                            collect when you create an account.
                        </p>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[58px] bg-[#0866ff] text-white rounded-full text-[18px] font-semibold"
                    >
                        {loading ? "Creating..." : "Submit"}
                    </button>

                </form>

                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full h-[58px] border border-[#ccd0d5] bg-white rounded-full mt-5 text-[17px] font-medium"
                >
                    I already have an account
                </button>

            </div>

        </div>
    );
}

export default Register;
