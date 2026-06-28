import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ArrowLeft } from "lucide-react";

import {
    getCurrentUser,
    updateProfile,
    uploadProfilePicture,
} from "../../api/userApi";

const genderOptions = [
    "Prefer not to say",
    "Female",
    "Male",
    "Custom",
];

const normalizeGender = (value) => {
    if (!value) {
        return genderOptions[0];
    }

    const match = genderOptions.find(
        (option) =>
            option.toLowerCase() ===
            String(value).toLowerCase()
    );

    return match || value;
};

const getGenderOptions = (value) => {
    const normalized = normalizeGender(value);
    const exists = genderOptions.some(
        (option) => option === normalized
    );

    return exists
        ? genderOptions
        : [
            ...genderOptions,
            normalized
        ];
};

function Avatar({ src, className = "" }) {
    if (src) {
        return (
            <img
                src={src}
                alt=""
                className={`rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`relative overflow-hidden rounded-full bg-[#d1d5db] ${className}`}
        >
            <div className="absolute left-1/2 top-[20%] h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-[#8b95a1]" />
            <div className="absolute bottom-[-12%] left-1/2 h-[52%] w-[86%] -translate-x-1/2 rounded-t-full bg-[#8b95a1]" />
        </div>
    );
}

function EditProfilePage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const loadedRef = useRef(false);
    const [user, setUser] = useState(null);
    const [bio, setBio] = useState("");
    const [gender, setGender] = useState(genderOptions[0]);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);

    const profileImage = useMemo(
        () => preview || user?.profilePicture || "",
        [preview, user?.profilePicture]
    );

    const loadUser = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getCurrentUser();

            setUser(data);
            setBio(data?.bio || "");
            setGender(normalizeGender(data?.gender));
            setPreview("");
        } catch (loadError) {
            setError(
                loadError.message || "Could not load your profile. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loadedRef.current) {
            return;
        }

        loadedRef.current = true;
        loadUser();
    }, []);

    const handlePhotoChange = async (
        event
    ) => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        setError("");
        setMessage("");

        const previewUrl =
            URL.createObjectURL(file);

        setPreview(previewUrl);
        setUploading(true);

        try {

            const updatedUser =
                await uploadProfilePicture(
                    file
                );

            setUser(updatedUser);

            setPreview(
                updatedUser.profilePicture
            );

            setMessage(
                "Profile photo updated successfully."
            );

        } catch (error) {

            URL.revokeObjectURL(
                previewUrl
            );

            setError(
                error.message
            );

        } finally {

            setUploading(false);

            event.target.value = "";
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const updatedUser = await updateProfile({
                bio,
                gender,
            });

            setUser(updatedUser);
            setBio(updatedUser?.bio || "");
            setGender(normalizeGender(updatedUser?.gender));
            setMessage("Profile saved.");
        } catch (saveError) {
            setError(
                saveError.message ||
                "Could not save your profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    

    return (
        <div className="min-h-screen bg-card text-primary">
            <div className="min-h-screen">
                <div className="flex min-h-screen">
                    <main className="flex min-h-screen flex-1 justify-center px-4 pb-24 pt-7 sm:px-6 lg:px-8">                        
                        <form
                            onSubmit={handleSubmit}
                            className="w-full max-w-[640px]"
                        >
                                <div className="flex items-center gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="p-2 rounded-full hover:bg-secondary transition-colors text-primary"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h1 className="text-[20px] font-bold leading-6">
                                    Edit profile
                                </h1>
                            </div>

                            {loading ? (
                                <div className="mt-10 flex justify-center py-24">
                                    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-t-primary" />
                                </div>
                            ) : (
                                <>
                                    <section className="mt-8 flex flex-col gap-4 rounded-2xl bg-tertiary p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar
                                                src={profileImage}
                                                className="h-14 w-14 shrink-0"
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-[15px] font-bold leading-[18px]">
                                                    {user?.username}
                                                </p>
                                                <p className="truncate text-[13px] leading-[16px] text-secondary">
                                                    {user?.fullName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 sm:justify-end">
                                            {uploading && (
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-[#4d5cff]" />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="h-8 shrink-0 rounded-lg bg-[#4d5cff] px-4 text-[13px] font-bold text-white transition hover:bg-[#3447ff] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {uploading ? "Uploading..." : "Change photo"}
                                            </button>
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </section>

                                    <FormField label="Bio">
                                        <div className="relative">
                                            <textarea
                                                value={bio}
                                                onChange={(event) =>
                                                    setBio(event.target.value.slice(0, 150))
                                                }
                                                placeholder="Bio"
                                                rows={2}
                                                className="min-h-[48px] w-full resize-none rounded-lg border border-primary bg-card px-3 py-2 pr-16 text-[14px] leading-5 outline-none transition focus:border-secondary"
                                            />
                                            <span className="absolute bottom-2 right-3 text-[11px] text-secondary">
                                                {bio.length} / 150
                                            </span>
                                        </div>
                                    </FormField>

                                    <FormField label="Gender">
                                        <div className="relative">
                                            <select
                                                value={gender}
                                                onChange={(event) =>
                                                    setGender(event.target.value)
                                                }
                                                className="h-11 w-full appearance-none rounded-lg border border-primary bg-card px-3 pr-10 text-[14px] outline-none transition focus:border-secondary"
                                            >
                                                {getGenderOptions(gender).map((option) => (
                                                    <option
                                                        key={option}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                size={16}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                                            />
                                        </div>
                                        <p className="mt-2 text-[12px] leading-[15px] text-secondary">
                                            This won&apos;t be part of your public profile.
                                        </p>
                                    </FormField>

                                    <FormField label="Show account suggestions on profiles">
                                        <TogglePanel
                                            description="Choose whether people can see similar account suggestions on your profile, and whether your account can be suggested on other profiles."
                                            checked={suggestionsEnabled}
                                            onChange={() =>
                                                setSuggestionsEnabled((value) => !value)
                                            }
                                        />
                                    </FormField>

                                    {(message || error) && (
                                        <div
                                            className={`mt-5 rounded-lg px-3 py-2 text-[13px] font-semibold ${error
                                                    ? "bg-[#ed4956]/10 text-[#ed4956]"
                                                    : "bg-[#0095f6]/10 text-[#0095f6]"
                                                }`}
                                        >
                                            {error || message}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="mt-9 h-11 w-full rounded-lg bg-[#4d5cff] text-[14px] font-bold text-white transition hover:bg-[#3447ff] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? "Saving..." : "Submit"}
                                    </button>
                                </>
                            )}
                        </form>
                    </main>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, children }) {
    return (
        <section className="mt-7">
            <label className="mb-3 block text-[15px] font-bold leading-[18px]">
                {label}
            </label>
            {children}
        </section>
    );
}

function TogglePanel({ title, description, checked, onChange }) {
    return (
        <div className="flex min-h-[57px] items-center justify-between gap-4 rounded-2xl border border-primary bg-card px-3 py-3">
            <div className="min-w-0">
                <p className="text-[14px] font-bold leading-[17px]">
                    {title}
                </p>
                <p className="mt-1 text-[11px] leading-[14px] text-secondary">
                    {description}
                </p>
            </div>

            <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-1 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
            ? "border-[#0095f6] bg-[#0095f6]"
            : "border-[#737373] bg-[#737373]"
    }`}
    aria-pressed={checked}
    aria-label={checked ? "On" : "Off"}
>
    <span
        className={`grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold shadow-sm transition-transform duration-200 ${
            checked
                ? "translate-x-6 text-[#0095f6]"
                : "translate-x-0 text-[#737373]"
        }`}
    >
        {checked ? "ON" : "OFF"}
    </span>
</button>
        </div>
    );
}

export default EditProfilePage;
