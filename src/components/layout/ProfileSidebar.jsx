import {
    Home,
    Search,
    Compass,
    Film,
    MessageCircle,
    Heart,
    PlusSquare,
    User
} from "lucide-react";

function ProfileSidebar() {
    return (
        <aside
            className="
                hidden
                lg:flex
                fixed
                left-0
                top-0
                h-screen
                w-[245px]
                border-r
                border-[#dbdbdb]
                bg-white
                flex-col
                px-3
                py-6
                z-50
            "
        >
            <h1
                className="
                    text-[28px]
                    font-bold
                    px-3
                    mb-10
                "
            >
                Instagram
            </h1>

            <nav className="flex flex-col gap-2">

                <SidebarItem icon={<Home />} text="Home" />
                <SidebarItem icon={<Search />} text="Search" />
                <SidebarItem icon={<Compass />} text="Explore" />
                <SidebarItem icon={<Film />} text="Reels" />
                <SidebarItem icon={<MessageCircle />} text="Messages" />
                <SidebarItem icon={<Heart />} text="Notifications" />
                <SidebarItem icon={<PlusSquare />} text="Create" />
                <SidebarItem icon={<User />} text="Profile" active />

            </nav>
        </aside>
    );
}

function SidebarItem({
    icon,
    text,
    active
}) {
    return (
        <button
            className={`
                flex
                items-center
                gap-4
                px-3
                py-3
                rounded-xl
                hover:bg-[#f2f2f2]
                transition
                ${active ? "font-bold" : ""}
            `}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
}

export default ProfileSidebar;