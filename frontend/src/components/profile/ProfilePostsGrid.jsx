function ProfilePostsGrid({
    posts,
    onSelectPost
}) {
    if (posts.length === 0) {
        return (
            <div className="
                flex
                justify-center
                py-24
            ">
                <div className="text-center">

                    <div className="text-6xl">
                        📷
                    </div>

                    <h2 className="
                        text-[28px]
                        font-light
                        mt-4
                    ">
                        Share Photos
                    </h2>

                    <p className="
                        mt-3
                        text-[#737373]
                    ">
                        When you share photos,
                        they will appear on your profile.
                    </p>

                </div>
            </div>
        );
    }

    return (
        <div
            className="
                grid
                grid-cols-3
                gap-[2px]
                md:gap-1
                mt-4
            "
        >
            {posts.map((post) => {

                const image =
                    post.media?.[0]?.mediaUrl;

                return (
                    <div
                        key={post.id}
                        onClick={() =>
                            onSelectPost(post)
                        }
                        className="
                            relative
                            aspect-square
                            cursor-pointer
                            group
                        "
                    >
                        <img
                            src={image}
                            alt=""
                            className="
                                w-full
                                h-full
                                object-cover
                            "
                        />

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
                                gap-8
                                text-white
                                font-semibold
                            "
                        >
                            <span>
                                ❤️ {post.likeCount || 0}
                            </span>

                            <span>
                                💬 0
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ProfilePostsGrid;