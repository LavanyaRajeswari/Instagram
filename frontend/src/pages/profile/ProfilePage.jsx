import { useEffect, useRef, useState } from "react";
import {
    Heart,
    MessageCircle,
    Send
} from "lucide-react";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import GettingStarted from "../../components/profile/GettingStarted";
import ProfileFooter from "../../components/profile/ProfileFooter";
import ProfileHighlights from "../../components/profile/ProfileHighlights";
import ImmersivePostModal from "../../components/ImmersivePostModal";
import CreatePostModal from "../../components/CreatePostModal";
import Sidebar from "../../components/Sidebar";

import { getPosts } from "../../api/postsApi";
import {
    getAuthToken,
    getCurrentUser,
    uploadProfilePicture
} from "../../api/userApi";

const fallbackUser = {
    id: 1,
    username: "ganga_saride",
    fullName: "ganga",
    followersCount: 0,
    followingCount: 0,
    profilePicture: ""
};

const readCurrentUser = () => {
    try {
        return (
            JSON.parse(
                localStorage.getItem("currentUser")
            ) || fallbackUser
        );
    } catch (error) {
        return fallbackUser;
    }
};

const persistCurrentUser = (nextUser) => {
    const previousUser = readCurrentUser();
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

const readCachedPosts = () => {
    try {
        const cache = localStorage.getItem(
            "instagram_posts"
        );

        return cache ? JSON.parse(cache) : [];
    } catch (error) {
        return [];
    }
};

const postBelongsToUser = (
    post,
    user
) => {
    const username =
        user?.username?.toLowerCase();

    const hasOwner =
        post.user ||
        post.userId ||
        post.username;

    return (
        !hasOwner ||
        post.user?.id === user?.id ||
        post.userId === user?.id ||
        post.user?.username?.toLowerCase() ===
            username ||
        post.username?.toLowerCase() === username
    );
};

function ProfilePage() {
    const [currentUser, setCurrentUser] =
        useState(readCurrentUser);

    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] =
        useState(false);
    const [uploadingPhoto, setUploadingPhoto] =
        useState(false);
    const fileInputRef = useRef(null);

    const [selectedImmersivePost, setSelectedImmersivePost] =
        useState(null);

    const loadProfile = async () => {
        try {
            setLoading(true);

            let profileUser = null;
            let allPosts = [];

            try {
                profileUser =
                    await getCurrentUser();
            } catch (error) {
                profileUser =
                    currentUser;
            }

            try {
                allPosts =
                    await getPosts(
                        profileUser?.id ||
                            currentUser?.id ||
                            1
                    );
            } catch (error) {
                allPosts = readCachedPosts();
            }

            const normalizedPosts = Array.isArray(
                allPosts
            )
                ? allPosts
                : allPosts?.content || [];

            const userPosts =
                normalizedPosts.filter(
                    (post) =>
                        postBelongsToUser(
                            post,
                            profileUser ||
                                currentUser
                        )
                );

            const nextUser =
                profileUser ||
                currentUser ||
                fallbackUser;

            setUser(nextUser);
            setCurrentUser(nextUser);
            setPosts(userPosts);

        } catch (error) {
            console.error(
                "Failed to load profile",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePhotoChange = async (
        event
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            setUploadingPhoto(true);
            const updatedUser =
                await uploadProfilePicture(file);

            const nextUser =
                updatedUser || user || currentUser;
            const mergedUser =
                persistCurrentUser(nextUser);

            setUser(mergedUser);
            setCurrentUser(mergedUser);
            await loadProfile();
        } catch (error) {
            console.error(
                "Failed to upload profile photo",
                error
            );
        } finally {
            event.target.value = "";
            setUploadingPhoto(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Sidebar compact />

                <div className="md:ml-[72px]">
                    <div className="flex justify-center items-center min-h-screen">

                        <div className="flex flex-col items-center">

                            <div
                                className="
                                    w-10
                                    h-10
                                    border-[3px]
                                    border-[#dbdbdb]
                                    border-t-black
                                    rounded-full
                                    animate-spin
                                "
                            />

                            <p className="mt-4 text-[#737373]">
                                Loading profile...
                            </p>

                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">

            <Sidebar
                compact
                onCreateClick={() =>
                    setCreateOpen(true)
                }
            />

            <main
                className="
                    min-h-screen
                    px-4
                    pb-[72px]
                    pt-0
                    md:ml-[72px]
                    md:px-8
                "
            >

                <div
                    className="
                        max-w-[935px]
                        mx-auto
                    "
                >

                    <ProfileHeader
                        user={user}
                        postsCount={
                            posts.length
                        }
                    />

                    <ProfileHighlights />

                    <ProfileTabs />

                    {posts.length === 0 ? (
                        <GettingStarted
                            onSharePhoto={() =>
                                setCreateOpen(true)
                            }
                            onAddProfilePhoto={() =>
                                fileInputRef.current?.click()
                            }
                        />
                    ) : (
                        <div
                            className="
                                grid
                                grid-cols-3
                                gap-[2px]
                                md:gap-1
                                mt-6
                            "
                        >

                            {posts.map(
                                (post) => {
                                    const image =
                                        post.media?.[0]
                                            ?.mediaUrl ||
                                        post.mediaUrl ||
                                        post.imageUrl ||
                                        post.images?.[0];

                                    return (
                                        <div
                                            key={
                                                post.id
                                            }
                                            className="
                                                relative
                                                aspect-square
                                                cursor-pointer
                                                group
                                            "
                                            onClick={() =>
                                                setSelectedImmersivePost(
                                                    post
                                                )
                                            }
                                        >

                                            {image ? (
                                                <img
                                                    src={
                                                        image
                                                    }
                                                    alt=""
                                                    className="
                                                        w-full
                                                        h-full
                                                        object-cover
                                                    "
                                                />
                                            ) : (
                                                <div
                                                    className="
                                                        flex
                                                        h-full
                                                        w-full
                                                        items-center
                                                        justify-center
                                                        bg-[#efefef]
                                                        text-[#8e8e8e]
                                                    "
                                                >
                                                    <MessageCircle
                                                        size={
                                                            32
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div
                                                className="
                                                    absolute
                                                    inset-0
                                                    bg-black/30
                                                    opacity-0
                                                    group-hover:opacity-100
                                                    transition
                                                    flex
                                                    items-center
                                                    justify-center
                                                    gap-6
                                                    text-white
                                                    font-semibold
                                                "
                                            >

                                                <span className="flex items-center gap-2">
                                                    <Heart
                                                        size={
                                                            20
                                                        }
                                                        fill="currentColor"
                                                    />
                                                    {post.likeCount || 0}
                                                </span>

                                                <span className="flex items-center gap-2">
                                                    <MessageCircle
                                                        size={
                                                            20
                                                        }
                                                        fill="currentColor"
                                                    />
                                                    {post.commentCount ||
                                                        0}
                                                </span>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                    <ProfileFooter />

                </div>

            </main>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={handleProfilePhotoChange}
            />

            <button
                type="button"
                className="
                    fixed
                    bottom-7
                    right-[30px]
                    z-30
                    hidden
                    h-[52px]
                    min-w-[226px]
                    items-center
                    gap-3
                    rounded-full
                    border
                    border-[#dbdbdb]
                    bg-white
                    px-[18px]
                    text-[15px]
                    font-bold
                    text-[#262626]
                    shadow-sm
                    transition
                    hover:bg-[#f7f7f7]
                    lg:flex
                "
            >
                <Send
                    size={24}
                    strokeWidth={2.2}
                />
                Messages
            </button>

            {createOpen && (
                <CreatePostModal
                    onClose={() =>
                        setCreateOpen(false)
                    }
                    onPostCreated={() => {
                        setCreateOpen(false);
                        loadProfile();
                    }}
                />
            )}

            {selectedImmersivePost && (
                <ImmersivePostModal
                    post={
                        selectedImmersivePost
                    }
                    postsList={posts}
                    onClose={() =>
                        setSelectedImmersivePost(
                            null
                        )
                    }
                    onRefresh={
                        loadProfile
                    }
                    onSelectPost={(
                        post
                    ) =>
                        setSelectedImmersivePost(
                            post
                        )
                    }
                />
            )}

        </div>
    );
}

export default ProfilePage;
