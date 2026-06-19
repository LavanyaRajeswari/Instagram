import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  SquarePlus,
  User,
  Menu,
  Grid2X2,
  Settings,
} from "lucide-react";
import { FiInstagram } from "react-icons/fi";

function Sidebar({ onCreateClick, compact = false }) {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home, match: ["/"] },
    { name: "Search", path: "/search", icon: Search, match: ["/search"] },
    { name: "Explore", path: "/explore", icon: Compass, match: ["/explore"] },
    { name: "Reels", path: "/reels", icon: Film, match: ["/reels"] },
    { name: "Messages", path: "/messages", icon: MessageCircle, match: ["/messages"] },
    { name: "Notifications", path: "/notifications", icon: Heart, match: ["/notifications"] },
  ];

  const profileActive =
    location.pathname === "/profile" ||
    location.pathname === "/edit-profile";

  const isActiveRoute = (item) =>
    item.match?.some((path) =>
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path)
    );

  const navClass = (isActive) =>
    `group flex w-full items-center justify-center gap-4 rounded-lg text-[15px] font-normal text-[#262626] transition-colors duration-200 hover:bg-[#f2f2f2] ${
      compact ? "h-7" : "h-12 p-3.5 xl:justify-start"
    } ${isActive ? "font-bold" : ""}`;

  const iconClass = (isActive) =>
    `h-6 w-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
      isActive ? "stroke-[2.5px]" : "stroke-2"
    }`;

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col items-center border-r border-[#dbdbdb] bg-white px-3 py-8 transition-all duration-300 md:flex ${
          compact ? "" : "xl:w-[244px] xl:items-start"
        }`}
      >
        <div
          className={`flex w-full items-center justify-center gap-3 ${
            compact ? "mb-[214px]" : "mb-8 xl:justify-start xl:px-3"
          }`}
        >
          <FiInstagram className="h-7 w-7 flex-shrink-0 text-[#262626]" />

          <h1
            className={`m-0 hidden select-none font-grand-hotel text-[34px] leading-none text-[#262626] ${
              compact ? "" : "xl:block"
            }`}
          >
            Instagram
          </h1>
        </div>

        <nav
          className={`flex w-full flex-grow flex-col ${
            compact ? "gap-[26px]" : "gap-1.5"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={navClass(isActive)}
              >
                <Icon
                  className={iconClass(isActive)}
                />
                <span className={compact ? "sr-only" : "hidden xl:inline"}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onCreateClick}
            className={navClass(false)}
          >
            <SquarePlus className={iconClass(false)} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              Create
            </span>
          </button>

          <Link
            to="/profile"
            className={navClass(profileActive)}
          >
            <User className={iconClass(profileActive)} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              Profile
            </span>
          </Link>

          <Link
            to="/edit-profile"
            className={`${navClass(location.pathname === "/edit-profile")} ${
              compact ? "hidden" : ""
            }`}
          >
            <Settings className={iconClass(location.pathname === "/edit-profile")} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              Edit Profile
            </span>
          </Link>
        </nav>

        <button
          type="button"
          className={`group mt-auto flex w-full items-center justify-center gap-4 rounded-lg text-[#262626] transition-colors duration-200 hover:bg-[#f2f2f2] ${
            compact ? "h-7" : "h-12 p-3.5 xl:justify-start"
          }`}
        >
          <Menu className="h-6 w-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className={compact ? "sr-only" : "hidden xl:inline"}>
            More
          </span>
        </button>

        {compact && (
          <button
            type="button"
            className="group mt-[30px] flex h-7 w-full items-center justify-center rounded-lg text-[#262626] transition-colors duration-200 hover:bg-[#f2f2f2]"
            aria-label="Apps"
          >
            <Grid2X2 className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
          </button>
        )}
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[50px] items-center justify-around border-t border-[#dbdbdb] bg-white md:hidden">
        <Link
          to="/"
          className={`p-2 text-[#262626] transition-all hover:scale-105 active:scale-95 ${
            location.pathname === "/" ? "font-bold" : ""
          }`}
        >
          <Home className="h-6 w-6" />
        </Link>

        <button
          type="button"
          onClick={onCreateClick}
          className="p-2 text-[#262626] transition-all hover:scale-105 active:scale-95"
        >
          <SquarePlus className="h-6 w-6" />
        </button>

        <Link
          to="/profile"
          className={`p-2 text-[#262626] transition-all hover:scale-105 active:scale-95 ${
            profileActive ? "font-bold" : ""
          }`}
        >
          <User className="h-6 w-6" />
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;
