import { Plus } from "lucide-react";

function ProfileHighlights() {
    return (
        <div
            className="
                mx-auto
                mt-[43px]
                flex
                w-full
                max-w-[613px]
                justify-center
                sm:justify-start
                sm:pl-[16px]
            "
        >
            <div className="flex flex-col items-center">

                <div
                    className="
                        h-[76px]
                        w-[76px]
                        rounded-full
                        border-[3px]
                        border-[#dbdbdb]
                        bg-[#efefef]
                        p-[3px]
                    "
                >
                    <div
                        className="
                            h-full
                            w-full
                            rounded-full
                            border-[2px]
                            border-[#ffffff]
                            flex
                            items-center
                            justify-center
                        "
                    >
                        <Plus
                            size={40}
                            strokeWidth={1.8}
                            className="text-[#737373]"
                        />
                    </div>
                </div>

                <span
                    className="
                        mt-2
                        text-[12px]
                        font-semibold
                        leading-[15px]
                    "
                >
                    New
                </span>

            </div>
        </div>
    );
}

export default ProfileHighlights;
