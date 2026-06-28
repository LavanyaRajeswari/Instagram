import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Film,
  Send,
  Heart,
  SquarePlus,
  User,
  Menu,
  Settings,
  Activity,
  Bookmark,
  Moon,
  Repeat,
  LogOut,
  MessageCircle,
  Bot,
} from "lucide-react";
import { FiInstagram } from "react-icons/fi";
import { FaWhatsapp, FaThreads } from "react-icons/fa6";
import { logoutUser } from "../api/userApi";
import { clearCurrentUserCache } from "../hooks/useCurrentUser";
import { getUnreadNotificationCount } from "../api/notificationsApi";
import { subscribeToNotifications, connect } from "../hooks/useWebSocket";
import { useEffect, useRef, useState } from "react";

function Sidebar({ onCreateClick, compact = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const moreRef = useRef(null);

  const refreshUnread = () => {
    getUnreadNotificationCount().then((data) => {
      const count = typeof data === "number" ? data : data?.count ?? 0;
      setUnreadCount(count);
    }).catch(() => {});
  };

  useEffect(() => {
    refreshUnread();

    const unsub = subscribeToNotifications(() => {
      refreshUnread();
    });

    connect();

    const handleSeen = () => refreshUnread();
    const handleNew = () => refreshUnread();

    window.addEventListener("notifications-seen", handleSeen);
    window.addEventListener("notification-new", handleNew);

    return () => {
      if (unsub) unsub();
      window.removeEventListener("notifications-seen", handleSeen);
      window.removeEventListener("notification-new", handleNew);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/notifications") {
      refreshUnread();
    }
  }, [location.pathname]);

  const navItems = [
    { name: "Home", path: "/", icon: Home, match: ["/"] },
    { name: "Reels", path: "/reels", icon: Film, match: ["/reels"] },
    { name: "Messages", path: "/messages", icon: Send, match: ["/messages"] },
    { name: "Search", path: "/search", icon: Search, match: ["/search"] },
    { name: "Notifications", path: "/notifications", icon: Heart, match: ["/notifications"] },
  ];

  const profileActive =
    location.pathname === "/profile" ||
    location.pathname.startsWith("/profile/") ||
    location.pathname === "/edit-profile";

  const isActiveRoute = (item) =>
    item.match?.some((path) =>
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path)
    );

  const navClass = (isActive) =>
    `group my-0.5 flex w-full items-center justify-center gap-4 rounded-lg text-[15px] font-normal text-primary transition-colors duration-200 hover:bg-hover ${
      compact ? "h-7" : "h-12 px-3.5 xl:justify-start"
    } ${isActive ? "font-bold" : ""}`;

  const iconClass = (isActive) =>
    `h-6 w-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
      isActive ? "stroke-[2.5px]" : "stroke-2"
    }`;

  useEffect(() => {
    const handleOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
        setMetaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    clearCurrentUserCache();
    navigate("/login", { replace: true });
  };

  const handleHomeClick = () => {
    setMoreOpen(false);
    setMetaOpen(false);
  };

  const moreItems = [
    { label: "Settings", icon: Settings, action: () => navigate("/settings/edit-profile") },
    { label: "Your Activity", icon: Activity, action: () => navigate("/settings/activity") },
    { label: "Saved", icon: Bookmark, action: () => navigate("/saved") },
    { label: "Switch Appearance", icon: Moon, action: () => navigate("/settings/appearance") },
    { label: "Switch Accounts", icon: Repeat, action: () => navigate("/switch-account") },
    { label: "Log Out", icon: LogOut, action: handleLogout },
  ];

  const metaItems = [
    { label: "WhatsApp", icon: FaWhatsapp, href: "https://www.whatsapp.com/" },
    { label: "Threads", icon: FaThreads, href: "https://www.threads.net/" },
    { label: "Meta AI", icon: Bot, href: "https://www.meta.ai/" },
  ];

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col items-center border-r border-primary bg-card px-3 py-8 transition-all duration-300 md:flex ${
          compact ? "" : "xl:w-[244px] xl:items-start"
        }`}
      >
        <Link
          to="/"
          onClick={handleHomeClick}
          className={`flex w-full items-center justify-center gap-3 ${
            compact ? "mb-[214px]" : "mb-8 xl:justify-start xl:px-3"
          }`}
          aria-label="Instagram home"
        >
          <FiInstagram className="h-7 w-7 flex-shrink-0 text-primary" />

          <h1
            className={`m-0 hidden select-none font-grand-hotel text-[34px] leading-none text-primary ${
              compact ? "" : "xl:block"
            }`}
          >
            Instagram
          </h1>
        </Link>

        <nav
          className={`flex w-full flex-grow flex-col justify-center ${
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
                aria-label={item.name}
              >
                <div className="relative inline-flex items-center">
                  <Icon className={iconClass(isActive)} />
                  {item.name === "Notifications" && unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ed4956] px-1 text-[10px] font-bold leading-none text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
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
            aria-label="Create"
          >
            <SquarePlus className={iconClass(false)} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              Create
            </span>
          </button>

          <Link
            to="/profile"
            className={navClass(profileActive)}
            aria-label="Profile"
          >
            <User className={iconClass(profileActive)} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              Profile
            </span>
          </Link>
        </nav>

        <div
          className={`mt-auto flex w-full flex-col ${
            compact ? "gap-[30px]" : "gap-1.5"
          }`}
          ref={moreRef}
        >
          {metaOpen && (
            <div className="absolute bottom-[72px] left-3 w-[220px] rounded-xl border border-primary bg-card p-2 shadow-xl">
              {metaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold hover:bg-hover"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                );
              })}
            </div>
          )}

          {moreOpen && (
            <div className="absolute bottom-[72px] left-3 w-[266px] overflow-hidden rounded-2xl border border-primary bg-card p-2 shadow-xl">
              {moreItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action();
                      setMoreOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm hover:bg-hover ${
                      index === moreItems.length - 1 ? "font-semibold" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={navClass(location.pathname.startsWith("/more"))}
            aria-label="More"
          >
            <Menu className={iconClass(location.pathname.startsWith("/more"))} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              More
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetaOpen((value) => !value)}
            className={navClass(location.pathname.startsWith("/also-from-meta"))}
            aria-label="Also from Meta"
          >
            <MessageCircle className={iconClass(location.pathname.startsWith("/also-from-meta"))} />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>
              Also from Meta
            </span>
          </button>

        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[50px] items-center justify-around border-t border-primary bg-card md:hidden">
        <Link
          to="/"
          onClick={handleHomeClick}
          className={`p-2 text-primary transition-all hover:scale-105 active:scale-95 ${
            location.pathname === "/" ? "font-bold" : ""
          }`}
          aria-label="Home"
        >
          <Home className="h-6 w-6" />
        </Link>

        <button
          type="button"
          onClick={onCreateClick}
          className="p-2 text-primary transition-all hover:scale-105 active:scale-95"
          aria-label="Create"
        >
          <SquarePlus className="h-6 w-6" />
        </button>

        <Link
          to="/profile"
          className={`p-2 text-primary transition-all hover:scale-105 active:scale-95 ${
            profileActive ? "font-bold" : ""
          }`}
          aria-label="Profile"
        >
          <User className="h-6 w-6" />
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;
