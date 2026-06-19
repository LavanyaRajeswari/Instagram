import { useEffect, useMemo, useRef, useState } from "react";
import {
    AtSign,
    Bell,
    ChevronDown,
    CircleSlash,
    EyeOff,
    Heart,
    Lock,
    MessageCircle,
    Search,
    Send,
    Shield,
    User,
    Users,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import {
    getAuthToken,
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

const readCachedUser = () => {
    try {
        const cached = localStorage.getItem(
            "currentUser"
        );

        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        return null;
    }
};

const persistUser = (nextUser) => {
    const previousUser = readCachedUser();
    const token =
        getAuthToken() ||
        previousUser?.token ||
        nextUser?.token;

    const mergedUser = {
        ...previousUser,
        ...nextUser,
        ...(token ? { token } : {})
    };

    localStorage.setItem(
        "currentUser",
        JSON.stringify(mergedUser)
    );

    if (token) {
        localStorage.setItem("token", token);
    }

    return mergedUser;
};

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

function SettingsSidebar() {
    const groups = [
        {
            title: "How you use Instagram",
            items: [
                {
                    label: "Edit profile",
                    icon: User,
                    active: true,
                },
                {
                    label: "Notifications",
                    icon: Bell,
                },
            ],
        },
        {
            title: "Who can see your content",
            items: [
                {
                    label: "Account privacy",
                    icon: Lock,
                },
                {
                    label: "Close Friends",
                    icon: Users,
                },
                {
                    label: "Blocked",
                    icon: CircleSlash,
                },
                {
                    label: "Story and location",
                    icon: EyeOff,
                },
            ],
        },
        {
            title: "How others can interact with you",
            items: [
                {
                    label: "Messages and story replies",
                    icon: Send,
                },
                {
                    label: "Tags and mentions",
                    icon: AtSign,
                },
                {
                    label: "Comments",
                    icon: MessageCircle,
                },
                {
                    label: "Restricted accounts",
                    icon: Shield,
                },
                {
                    label: "Hidden Words",
                    icon: EyeOff,
                },
            ],
        },
    ];

    return (
        <aside className="hidden w-[320px] shrink-0 border-r border-[#dbdbdb] bg-white px-5 py-6 lg:block">
            <h2 className="px-5 text-[20px] font-bold leading-6 text-[#262626]">
                Settings
            </h2>

            <div className="mt-5 flex h-[36px] items-center gap-3 rounded-full bg-[#efefef] px-4 text-[#737373]">
                <Search size={18} />
                <span className="text-[14px]">Search</span>
            </div>

            <section className="mt-3 rounded-xl bg-[#fafafa] p-4">
                <div className="flex items-center gap-1 text-[14px] font-semibold text-[#262626]">
                    <span className="font-bold text-[#0095f6]">∞</span>
                    Meta
                </div>

                <h3 className="mt-2 text-[15px] font-bold text-[#262626]">
                    Accounts Center
                </h3>

                <p className="mt-1 text-[11px] leading-[14px] text-[#737373]">
                    Manage your connected experiences and account settings across Meta technologies.
                </p>

                <div className="mt-4 space-y-3 text-[12px] text-[#737373]">
                    <p>Personal details</p>
                    <p>Password and security</p>
                    <p>Ad preferences</p>
                </div>

                <button
                    type="button"
                    className="mt-4 text-[12px] font-semibold text-[#3858e9]"
                >
                    See more in Accounts Center
                </button>
            </section>

            <div className="mt-4 space-y-6 pb-8">
                {groups.map((group) => (
                    <section key={group.title}>
                        <h3 className="px-5 text-[12px] font-bold text-[#737373]">
                            {group.title}
                        </h3>

                        <div className="mt-2 space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        type="button"
                                        key={item.label}
                                        className={`flex h-12 w-full items-center gap-4 rounded-lg px-5 text-left text-[14px] font-semibold text-[#262626] transition-colors hover:bg-[#f2f2f2] ${item.active ? "bg-[#efefef]" : ""
                                            }`}
                                    >
                                        <Icon size={21} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </aside>
    );
}

function EditProfilePage() {
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
    const [aiCreatorEnabled, setAiCreatorEnabled] = useState(false);

    const profileImage = useMemo(
        () => preview || user?.profilePicture || "",
        [preview, user?.profilePicture]
    );

    const loadUser = async () => {
        try {
            setLoading(true);
            setError("");

            const cachedUser = readCachedUser();

            if (cachedUser) {
                setUser(cachedUser);
                setBio(cachedUser?.bio || "");
                setGender(
                    normalizeGender(cachedUser?.gender)
                );
            }

            const data = await getCurrentUser();
            const mergedUser = persistUser(data);

            setUser(mergedUser);
            setBio(mergedUser?.bio || "");
            setGender(
                normalizeGender(mergedUser?.gender)
            );
            setPreview("");
        } catch (loadError) {
            const cachedUser = readCachedUser();

            if (cachedUser) {
                setUser(cachedUser);
                setBio(cachedUser?.bio || "");
                setGender(
                    normalizeGender(cachedUser?.gender)
                );
                setError(
                    loadError.message ||
                    "Showing saved profile data. Log in again to refresh from the backend."
                );
            } else {
                setError(
                    loadError.message ||
                    "Could not load your profile. Please try again."
                );
            }
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

            const mergedUser =
                persistUser(updatedUser);

            setUser(mergedUser);

            setPreview(
                mergedUser.profilePicture
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

            const mergedUser = persistUser(updatedUser);

            setUser(mergedUser);
            setBio(mergedUser?.bio || "");
            setGender(
                normalizeGender(mergedUser?.gender)
            );
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
        <div className="min-h-screen bg-white text-[#262626]">
            <Sidebar />

            <div className="min-h-screen md:ml-[72px] xl:ml-[244px]">
                <div className="flex min-h-screen">
                    <SettingsSidebar />

                    <main className="flex min-h-screen flex-1 justify-center px-4 pb-24 pt-7 sm:px-6 lg:px-10 xl:px-14">
                        <form
                            onSubmit={handleSubmit}
                            className="w-full max-w-[640px]"
                        >
                            <h1 className="text-[20px] font-bold leading-6">
                                Edit profile
                            </h1>

                            {loading ? (
                                <div className="mt-10 flex justify-center py-24">
                                    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#dbdbdb] border-t-[#262626]" />
                                </div>
                            ) : (
                                <>
                                    <section className="mt-8 flex flex-col gap-4 rounded-2xl bg-[#f2f2f2] p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar
                                                src={profileImage}
                                                className="h-14 w-14 shrink-0"
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-[15px] font-bold leading-[18px]">
                                                    {user?.username}
                                                </p>
                                                <p className="truncate text-[13px] leading-[16px] text-[#737373]">
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

                                    <FormField label="Website">
                                        <input
                                            value=""
                                            disabled
                                            placeholder="Website"
                                            className="h-11 w-full rounded-lg border border-transparent bg-[#efefef] px-3 text-[14px] text-[#737373] outline-none"
                                        />
                                        <p className="mt-2 text-[12px] leading-[15px] text-[#737373]">
                                            Editing your links is only available on mobile. Visit the Instagram app and edit your profile to change the websites in your bio.
                                        </p>
                                    </FormField>

                                    <FormField label="Bio">
                                        <div className="relative">
                                            <textarea
                                                value={bio}
                                                onChange={(event) =>
                                                    setBio(event.target.value.slice(0, 150))
                                                }
                                                placeholder="Bio"
                                                rows={2}
                                                className="min-h-[48px] w-full resize-none rounded-lg border border-[#dbdbdb] bg-white px-3 py-2 pr-16 text-[14px] leading-5 outline-none transition focus:border-[#a8a8a8]"
                                            />
                                            <span className="absolute bottom-2 right-3 text-[11px] text-[#737373]">
                                                {bio.length} / 150
                                            </span>
                                        </div>
                                    </FormField>

                                    <FormField label="AI creator">
                                        <TogglePanel
                                            title="AI creator"
                                            description="Add this label to your profile if your content often uses AI."
                                            checked={aiCreatorEnabled}
                                            onChange={() =>
                                                setAiCreatorEnabled((value) => !value)
                                            }
                                        />
                                    </FormField>

                                    <FormField label="Gender">
                                        <div className="relative">
                                            <select
                                                value={gender}
                                                onChange={(event) =>
                                                    setGender(event.target.value)
                                                }
                                                className="h-11 w-full appearance-none rounded-lg border border-[#dbdbdb] bg-white px-3 pr-10 text-[14px] outline-none transition focus:border-[#a8a8a8]"
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
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]"
                                            />
                                        </div>
                                        <p className="mt-2 text-[12px] leading-[15px] text-[#737373]">
                                            This won&apos;t be part of your public profile.
                                        </p>
                                    </FormField>

                                    <FormField label="Show account suggestions on profiles">
                                        <TogglePanel
                                            title="Show account suggestions on profiles"
                                            description="Choose whether people can see similar account suggestions on your profile, and whether your account can be suggested on other profiles."
                                            checked={suggestionsEnabled}
                                            onChange={() =>
                                                setSuggestionsEnabled((value) => !value)
                                            }
                                        />
                                    </FormField>

                                    <p className="mt-7 text-[12px] leading-[16px] text-[#737373]">
                                        Certain profile info, like your name, bio and links, is visible to everyone.{" "}
                                        <span className="font-semibold text-[#3858e9]">
                                            See what profile info is visible
                                        </span>
                                    </p>

                                    {(message || error) && (
                                        <div
                                            className={`mt-5 rounded-lg px-3 py-2 text-[13px] font-semibold ${error
                                                    ? "bg-red-50 text-red-600"
                                                    : "bg-green-50 text-green-700"
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
        <div className="flex min-h-[57px] items-center justify-between gap-4 rounded-2xl border border-[#dbdbdb] bg-white px-3 py-3">
            <div className="min-w-0">
                <p className="text-[14px] font-bold leading-[17px]">
                    {title}
                </p>
                <p className="mt-1 text-[11px] leading-[14px] text-[#737373]">
                    {description}
                </p>
            </div>

            <button
                type="button"
                onClick={onChange}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[#262626]" : "bg-[#dbdbdb]"
                    }`}
                aria-pressed={checked}
            >
                <span
                    className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[17px]" : "translate-x-[2px]"
                        }`}
                />
            </button>
        </div>
    );
}

export default EditProfilePage;
