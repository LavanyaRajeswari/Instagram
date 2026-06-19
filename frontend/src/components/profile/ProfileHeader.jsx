import {
    Camera,
    Settings
} from "lucide-react";
import { Link } from "react-router-dom";

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
    postsCount
}) {
    const username =
        user?.username ||
        "ganga_saride";

    const fullName =
        user?.fullName ||
        user?.name ||
        username;

    const followersCount = getCount(
        user,
        [
            "followersCount",
            "followerCount",
            "followers"
        ]
    );

    const followingCount = getCount(
        user,
        [
            "followingCount",
            "following"
        ]
    );

    return (
        <section className="pt-[34px] md:pt-[64px]">
            <div
                className="
                    mx-auto
                    w-full
                    max-w-[613px]
                "
            >
                <div
                    className="
                        flex
                        flex-row
                        items-center
                        justify-center
                        gap-6
                        sm:justify-start
                    "
                >
                    <div
                        className="
                            relative
                            h-[118px]
                            w-[118px]
                            shrink-0
                            rounded-full
                            sm:h-[150px]
                            sm:w-[150px]
                        "
                    >
                        {user?.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt=""
                                className="
                                    h-full
                                    w-full
                                    rounded-full
                                    object-cover
                                "
                            />
                        ) : (
                            <div
                                className="
                                    relative
                                    h-full
                                    w-full
                                    overflow-hidden
                                    rounded-full
                                    bg-[#a8a8a8]
                                "
                            >
                                <div
                                    className="
                                        absolute
                                        left-1/2
                                        top-[28px]
                                        h-[48px]
                                        w-[48px]
                                        -translate-x-1/2
                                        rounded-full
                                        bg-[#737373]
                                        sm:top-[34px]
                                        sm:h-[60px]
                                        sm:w-[60px]
                                    "
                                />

                                <div
                                    className="
                                        absolute
                                        bottom-[-12px]
                                        left-1/2
                                        h-[68px]
                                        w-[118px]
                                        -translate-x-1/2
                                        rounded-t-full
                                        bg-[#737373]
                                        sm:h-[82px]
                                        sm:w-[150px]
                                    "
                                />

                                <div
                                    className="
                                        absolute
                                        left-1/2
                                        top-1/2
                                        flex
                                        h-[42px]
                                        w-[42px]
                                        -translate-x-1/2
                                        -translate-y-1/2
                                        items-center
                                        justify-center
                                        rounded-[10px]
                                        bg-white
                                        text-[#737373]
                                        sm:h-[50px]
                                        sm:w-[50px]
                                    "
                                >
                                    <Camera
                                        size={30}
                                        strokeWidth={3}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className="
                            flex
                            min-w-0
                            flex-1
                            flex-col
                            items-start
                            text-[#000000]
                        "
                    >
                        <div
                            className="
                                flex
                                w-full
                                items-center
                                gap-2
                            "
                        >
                            <h1
                                className="
                                    max-w-full
                                    truncate
                                    text-[22px]
                                    font-bold
                                    leading-[27px]
                                    sm:text-[25px]
                                "
                            >
                                {username}
                            </h1>

                            <Settings
                                size={22}
                                strokeWidth={2.6}
                                className="
                                    mt-[1px]
                                    shrink-0
                                "
                            />
                        </div>

                        <p
                            className="
                                mt-[6px]
                                max-w-full
                                truncate
                                text-[13px]
                                font-semibold
                                leading-[18px]
                            "
                        >
                            {fullName}
                        </p>

                        <div
                            className="
                                mt-[9px]
                                flex
                                flex-wrap
                                gap-x-[16px]
                                gap-y-1
                                text-[13px]
                                font-semibold
                                leading-[18px]
                            "
                        >
                            <span>
                                <b>{postsCount}</b>{" "}
                                posts
                            </span>

                            <span>
                                <b>{followersCount}</b>{" "}
                                followers
                            </span>

                            <span>
                                <b>{followingCount}</b>{" "}
                                following
                            </span>
                        </div>

                        {user?.bio && (
                            <p
                                className="
                                    mt-[7px]
                                    max-h-[54px]
                                    overflow-hidden
                                    text-[13px]
                                    leading-[18px]
                                "
                            >
                                {user.bio}
                            </p>
                        )}
                    </div>
                </div>

                <div
                    className="
                        mt-5
                        grid
                        grid-cols-2
                        gap-2
                    "
                >
                    <Link
                        to="/edit-profile"
                        className="
                            flex
                            h-10
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#efefef]
                            text-[13px]
                            font-bold
                            text-[#000000]
                            transition
                            hover:bg-[#dbdbdb]
                        "
                    >
                        Edit profile
                    </Link>

                    <button
                        type="button"
                        className="
                                h-10
                                rounded-lg
                                bg-[#efefef]
                                text-[13px]
                                font-bold
                                text-[#000000]
                                transition
                                hover:bg-[#dbdbdb]
                            "
                    >
                        View archive
                    </button>
                </div>
            </div>
        </section>
    );
}

export default ProfileHeader;
