import {
    Grid3X3,
    Bookmark,
    UserSquare2
} from "lucide-react";

function ProfileTabs() {
    return (
        <div className="
            border-t
            border-[#dbdbdb]
            mt-[70px]
            flex
            justify-center
            gap-[88px]
            sm:gap-[162px]
        ">

            <button
                className="
                    flex
                    items-center
                    gap-2
                    py-4
                    border-t-2
                    border-black
                    -mt-[1px]
                    text-[#000000]
                "
                aria-label="Posts"
            >
                <Grid3X3
                    size={24}
                    strokeWidth={2.7}
                />
            </button>

            <button
                className="
                    flex
                    items-center
                    gap-2
                    py-4
                    text-[#8e8e8e]
                "
                aria-label="Saved"
            >
                <Bookmark
                    size={24}
                    strokeWidth={2.2}
                />
            </button>

            <button
                className="
                    flex
                    items-center
                    gap-2
                    py-4
                    text-[#8e8e8e]
                "
                aria-label="Tagged"
            >
                <UserSquare2
                    size={24}
                    strokeWidth={2.2}
                />
            </button>

        </div>
    );
}

export default ProfileTabs;
