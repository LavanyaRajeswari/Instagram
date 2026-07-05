import {
    Camera,
    LogOut,
    Settings
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { logoutUser } from "../../api/userApi";
import { followUser, unfollowUser } from "../../api/followApi";
import { api } from "../../api/client";
import { cancelFollowRequest } from "../../api/followRequestsApi";
import { clearCurrentUserCache, useCurrentUser } from "../../hooks/useCurrentUser";

const getCount = (
    user,
    keys,
    fallback = 0
) => {
    for (const key of keys) {
        const value = user?.[key];

        if (Array.isArray(value)) {
            return value.length;
        }

        if (
            typeof value === "number" ||
            typeof value === "string"
        ) {
            return value;
        }
    }

    return fallback;
};

function ProfileHeader({
                           user,
                           postsCount,
                           isOwnProfile,
                           onProfilePhotoClick,
                           onFollowersClick,
                           onFollowingClick,
                           noteSlot,
                           extraAction
                       }) {
    const navigate = useNavigate();
    const { currentUserId } = useCurrentUser();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [following, setFollowing] = useState(false);
    const [followRequestPending, setFollowRequestPending] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const popupRef = useRef(null);
    const username =
        user?.username ||
        "instagram_user";

    const fullName =
        user?.fullName ||
        user?.name ||
        username;

    const followersCount = getCount(user, ["followers", "followersCount"], 0);
    const followingCount = getCount(user, ["following", "followingCount"], 0);

    const totalPosts = user?.postsCount ?? postsCount ?? 0;

    const ownProfile = isOwnProfile ?? (currentUserId && user?.id && String(currentUserId) === String(user.id));

    useEffect(() => {
        if (!ownProfile && user?.id && currentUserId) {
            api.get(`/users/${user.id}/follow/status`)
                .then(({ data }) => {
                    if (typeof data === "boolean") {
                        setFollowing(data);
                        setFollowRequestPending(false);
                    } else {
                        setFollowing(Boolean(data?.following ?? data?.status));
                        setFollowRequestPending(Boolean(data?.requested ?? data?.pending));
                    }
                })
                .catch(() => { setFollowing(false); setFollowRequestPending(false); });
        }
    }, [user?.id, currentUserId, ownProfile]);

    useEffect(() => {
        const handleOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setSettingsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const handleLogout = async () => {
        await logoutUser();
        clearCurrentUserCache();
        navigate("/login", { replace: true });
    };

    const handleFollowToggle = async () => {
        if (!user?.id || followLoading) return;
        setFollowLoading(true);
        try {
            if (following) {
                await unfollowUser(user.id);
                setFollowing(false);
                setFollowRequestPending(false);
            } else if (followRequestPending) {
                await cancelFollowRequest(user.id);
                setFollowRequestPending(false);
            } else {
                await followUser(user.id);
                if (user?.isPrivate) {
                    setFollowRequestPending(true);
                } else {
                    setFollowing(true);
                }
            }
        } catch (_err) {
        } finally {
            setFollowLoading(false);
        }
    };

    const settingsItems = [
        ["Notifications", "/settings/notifications"],
    ];

    return (
        <section className="pt-[34px] md:pt-[64px]">
            <div className="mx-auto w-full max-w-[613px]">
                <div className="flex flex-row items-center justify-center gap-6 sm:justify-start">
                    <div className="relative h-[118px] w-[118px] shrink-0 sm:h-[150px] sm:w-[150px]">
                        {noteSlot}
                        <button
                            type="button"
                            onClick={onProfilePhotoClick}
                            disabled={!onProfilePhotoClick}
                            className="h-full w-full rounded-full cursor-pointer"
                        >
                            {
                                user?.profilePicture &&
                                user.profilePicture.trim() !== ""
                                    ? (
                                        <img
                                            src={user.profilePicture}
                                            alt=""
                                            className="h-full w-full rounded-full object-cover"
                                            onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                                        />
                                    ) : (
                                        <div className="relative h-full w-full overflow-hidden rounded-full bg-[#a8a8a8]">
                                            <div className="absolute left-1/2 top-[28px] h-[48px] w-[48px] -translate-x-1/2 rounded-full bg-[#737373] sm:top-[34px] sm:h-[60px] sm:w-[60px]" />
                                            <div className="absolute bottom-[-12px] left-1/2 h-[68px] w-[118px] -translate-x-1/2 rounded-t-full bg-[#737373] sm:h-[82px] sm:w-[150px]" />
                                            <div className="absolute left-1/2 top-1/2 flex h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[10px] bg-card text-secondary sm:h-[50px] sm:w-[50px]">
                                                <Camera size={30} strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                        </button>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col items-start text-primary">
                        <div className="flex w-full items-center gap-2">
                            <h1 className="max-w-full truncate text-[22px] font-bold leading-[27px] sm:text-[25px]">
                                {username}
                            </h1>

                            {ownProfile && (
                                <button
                                    type="button"
                                    onClick={() => setSettingsOpen(true)}
                                    className="rounded-full p-1 transition hover:bg-tertiary"
                                >
                                    <Settings size={20} strokeWidth={2.4} />
                                </button>
                            )}

                            {settingsOpen && (
                                <div className="fixed inset-0 z-[90000] flex items-center justify-center bg-black/40">
                                    <div
                                        ref={popupRef}
                                        className="w-[400px] max-w-[92vw] overflow-hidden rounded-xl bg-card text-center shadow-2xl"
                                    >
                                        {settingsItems.map(([label, path]) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => {
                                                    setSettingsOpen(false);
                                                    navigate(path);
                                                }}
                                                className="block h-12 w-full border-b border-primary text-sm hover:bg-secondary"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex h-12 w-full items-center justify-center gap-2 border-b border-primary text-sm font-semibold text-[#ed4956] hover:bg-secondary"
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSettingsOpen(false)}
                                            className="h-12 w-full text-sm hover:bg-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="mt-[6px] max-w-full truncate text-[13px] font-semibold leading-[18px]">
                            {fullName}
                        </p>

                        <div className="mt-[9px] flex flex-wrap gap-x-[16px] gap-y-1 text-[13px] font-semibold leading-[18px]">
                            <span>
                                <b>{totalPosts}</b>{" "}
                                posts
                            </span>

                            <button
                                type="button"
                                onClick={onFollowersClick}
                                className="hover:opacity-70"
                            >
                                <b>{followersCount}</b> followers
                            </button>

                            <button
                                type="button"
                                onClick={onFollowingClick}
                                className="hover:opacity-70"
                            >
                                <b>{followingCount}</b> following
                            </button>
                        </div>

                        {user?.bio && (
                            <p className="mt-[7px] max-h-[54px] overflow-hidden text-[13px] leading-[18px]">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                    {ownProfile ? (
                        <>
                            <Link
                                to="/edit-profile"
                                className="flex h-10 items-center justify-center rounded-lg bg-tertiary text-[13px] font-bold text-primary transition hover:bg-secondary"
                            >
                                Edit profile
                            </Link>

                            <Link
                                to="/archive"
                                className="flex h-10 items-center justify-center rounded-lg bg-tertiary text-[13px] font-bold text-primary transition hover:bg-secondary"
                            >
                                View Archive
                            </Link>

                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleFollowToggle}
                                disabled={followLoading}
                                className={`h-10 rounded-lg text-[13px] font-bold transition disabled:opacity-60 ${
                                    following || followRequestPending
                                        ? "bg-tertiary text-primary hover:bg-secondary"
                                        : "bg-[#0095f6] text-white hover:bg-[#1877f2]"
                                }`}
                            >
                                {followLoading ? "..." : followRequestPending ? "Pending" : following ? "Following" : "Follow"}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(`/messages?userId=${user.id}`)}
                                className="h-10 rounded-lg bg-tertiary text-[13px] font-bold text-primary transition hover:bg-secondary"
                            >
                                Message
                            </button>
                        </>
                    )}

                    {!ownProfile && extraAction}
                </div>
            </div>
        </section>
    );
}

export default ProfileHeader;
