function ProfileFooter() {
    const links = [
        "Meta",
        "About",
        "Blog",
        "Jobs",
        "Help",
        "API",
        "Privacy",
        "Terms",
        "Locations",
        "Popular",
        "Instagram Lite",
        "Meta AI",
        "Threads",
        "Contact Uploading & Non-Users",
        "Meta Verified",
    ];

    return (
        <footer className="mt-[143px] pb-[56px]">

            <div
                className="
                    flex
                    flex-wrap
                    justify-center
                    gap-x-[16px]
                    gap-y-3
                    text-[11px]
                    leading-[14px]
                    text-[#737373]
                "
            >
                {links.map((link) => (
                    <span key={link}>
                        {link}
                    </span>
                ))}
            </div>

            <div
                className="
                    text-center
                    text-[11px]
                    leading-[14px]
                    text-[#737373]
                    mt-[20px]
                "
            >
                English⌄ &nbsp; © 2026 Instagram from Meta
            </div>

        </footer>
    );
}

export default ProfileFooter;
