import {
    Camera,
    UserPlus
} from "lucide-react";

function GettingStarted({
    onSharePhoto,
    onAddProfilePhoto
}) {
    return (
        <div className="mt-[10px]">

            <h2
                className="
                    mb-[12px]
                    text-[13px]
                    font-bold
                    leading-[16px]
                    text-[#000000]
                "
            >
                Getting Started
            </h2>

            <div
                className="
                    grid
                    max-w-[457px]
                    grid-cols-1
                    gap-2
                    sm:grid-cols-2
                "
            >
                <Card
                    icon={<Camera size={30} />}
                    title="Share Photos"
                    description="When you share photos, they will appear on your profile."
                    buttonText="Share your first photo"
                    onClick={onSharePhoto}
                />

                <Card
                    icon={<UserPlus size={30} />}
                    title="Add Profile Photo"
                    description="Choose a profile photo so your friends know it's you."
                    buttonText="Add profile photo"
                    onClick={onAddProfilePhoto}
                />
            </div>

        </div>
    );
}

function Card({
    icon,
    title,
    description,
    buttonText,
    onClick
}) {
    return (
        <div
            className="
                h-[214px]
                min-w-0
                border
                border-[#dbdbdb]
                rounded-[4px]
                bg-white
                px-3
                pb-[11px]
                pt-[11px]
            "
        >
            <div className="flex justify-center">
                <div
                    className="
                        h-[51px]
                        w-[51px]
                        rounded-full
                        border
                        border-[#000000]
                        flex
                        items-center
                        justify-center
                        text-[#000000]
                    "
                >
                    {icon}
                </div>
            </div>

            <h3
                className="
                    text-center
                    mt-[12px]
                    font-semibold
                    text-[14px]
                    leading-[18px]
                "
            >
                {title}
            </h3>

            <p
                className="
                    mt-[12px]
                    text-[#737373]
                    text-[11px]
                    leading-[13px]
                "
            >
                {description}
            </p>

            <button
                className="
                    mx-auto
                    mt-[43px]
                    flex
                    h-[30px]
                    min-w-[135px]
                    max-w-full
                    items-center
                    justify-center
                    rounded-lg
                    bg-[#4d5cff]
                    px-[14px]
                    text-white
                    font-semibold
                    text-[13px]
                    leading-none
                    transition
                    hover:bg-[#3447ff]
                "
                onClick={onClick}
            >
                {buttonText}
            </button>
        </div>
    );
}

export default GettingStarted;
