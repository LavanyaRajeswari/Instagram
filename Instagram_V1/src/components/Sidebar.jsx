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
} from "lucide-react";
import { FiInstagram } from "react-icons/fi";

function Sidebar({ onCreateClick }) {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "#", icon: Search },
    { name: "Explore", path: "#", icon: Compass },
    { name: "Reels", path: "#", icon: Film },
    { name: "Messages", path: "#", icon: MessageCircle },
    { name: "Notifications", path: "#", icon: Heart },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col items-center border-r border-[#dbdbdb] bg-white p-3 py-6 transition-all duration-300 md:flex xl:w-[244px] xl:items-start">
        <div className="mb-8 flex w-full items-center justify-center gap-3 px-3 xl:justify-start">
          <FiInstagram className="h-7 w-7 flex-shrink-0 text-[#262626]" />

          <h1 className="m-0 hidden select-none font-grand-hotel text-[34px] leading-none text-[#262626] xl:block">
            Instagram
          </h1>
        </div>

        <nav className="flex w-full flex-grow flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`my-0.5 flex w-full items-center justify-center gap-4 rounded-full p-3.5 text-[15px] font-normal text-[#262626] transition-all hover:bg-[#f2f2f2] xl:justify-start ${
                  isActive ? "font-bold" : ""
                }`}
              >
                <Icon
                  className={`h-6 w-6 flex-shrink-0 ${
                    isActive ? "stroke-[2.5px]" : "stroke-2"
                  }`}
                />
                <span className="hidden xl:inline">{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onCreateClick}
            className="my-0.5 flex w-full items-center justify-center gap-4 rounded-full p-3.5 text-left text-[15px] font-normal text-[#262626] transition-all hover:bg-[#f2f2f2] xl:justify-start"
          >
            <SquarePlus className="h-6 w-6 flex-shrink-0" />
            <span className="hidden xl:inline">Create</span>
          </button>

          <Link
            to="/profile"
            className={`my-0.5 flex w-full items-center justify-center gap-4 rounded-full p-3.5 text-[15px] font-normal text-[#262626] transition-all hover:bg-[#f2f2f2] xl:justify-start ${
              location.pathname === "/profile" ? "font-bold" : ""
            }`}
          >
            <User
              className={`h-6 w-6 flex-shrink-0 ${
                location.pathname === "/profile"
                  ? "stroke-[2.5px]"
                  : "stroke-2"
              }`}
            />
            <span className="hidden xl:inline">Profile</span>
          </Link>
        </nav>

        <button
          type="button"
          className="mt-auto flex w-full items-center justify-center gap-4 rounded-full p-3.5 text-[#262626] transition-all hover:bg-[#f2f2f2] xl:justify-start"
        >
          <Menu className="h-6 w-6 flex-shrink-0" />
          <span className="hidden xl:inline">More</span>
        </button>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[50px] items-center justify-around border-t border-[#dbdbdb] bg-white md:hidden">
        <Link
          to="/"
          className="p-2 text-[#262626] transition-all hover:scale-105 active:scale-95"
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
          className="p-2 text-[#262626] transition-all hover:scale-105 active:scale-95"
        >
          <User className="h-6 w-6" />
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;