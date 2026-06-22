import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Download, LogOut } from "lucide-react";
import { logoutUser, searchUsers, updateProfile } from "../../api/userApi";
import {
  addCloseFriend,
  addHiddenStoryUser,
  blockUser,
  getBlockedAccounts,
  getCloseFriends,
  getHiddenStoryUsers,
  getMessagePrivacySettings,
  removeCloseFriend,
  removeHiddenStoryUser,
  unblockUser,
  updateMessagePrivacySettings,
} from "../../api/settingsApi";
import { useCurrentUser, clearCurrentUserCache } from "../../hooks/useCurrentUser";
import { getAvatarUrl } from "../../utils/avatar";

const items = [
  { slug: "", label: "Settings and Privacy" },
  { slug: "notifications", label: "Notifications" },
  { slug: "apps-and-websites", label: "Apps and Websites" },
  { slug: "privacy", label: "Privacy" },
  { slug: "close-friends", label: "Close Friends" },
  { slug: "blocked-accounts", label: "Blocked Accounts" },
  { slug: "story-location", label: "Story and Location" },
  { slug: "messages-replies", label: "Messages and Story Replies" },
  { slug: "restricted-accounts", label: "Restricted Accounts" },
  { slug: "tags-mentions", label: "Tags and Mentions" },
  { slug: "comments", label: "Comments" },
  { slug: "sharing-reuse", label: "Sharing and Reuse" },
  { slug: "meta-verified", label: "Meta Verified" },
  { slug: "supervision", label: "Supervision" },
  { slug: "login-activity", label: "Login Activity" },
];

function MissingEndpoint({ endpoints }) {
  return (
    <div className="rounded-lg border border-[#dbdbdb] bg-[#fafafa] p-4 text-sm text-[#737373]">
      Backend endpoint missing: {endpoints.join(", ")}
    </div>
  );
}

const normalizeUser = (item, key) => item?.[key] || item?.user || item;

function UserListSettings({ title, type, currentUserId }) {
  const isCloseFriends = type === "close-friends";
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = isCloseFriends ? await getCloseFriends() : await getBlockedAccounts();
      setItems(data);
    } catch (error) {
      console.error(`Failed to load ${title}`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [type]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      try {
        const data = await searchUsers(trimmed);
        setResults((Array.isArray(data) ? data : []).filter((user) => user.id !== currentUserId));
      } catch (error) {
        console.error("User search failed", error);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  const listedUsers = items.map((item) => normalizeUser(item, isCloseFriends ? "friend" : "blocked")).filter(Boolean);
  const listedUserIds = new Set(listedUsers.map((user) => String(user.id)));

  const addUser = async (userId) => {
    setSavingId(userId);
    try {
      if (isCloseFriends) await addCloseFriend(userId);
      else await blockUser(userId);
      setQuery("");
      setResults([]);
      await loadItems();
    } finally {
      setSavingId(null);
    }
  };

  const removeUser = async (userId) => {
    setSavingId(userId);
    try {
      if (isCloseFriends) await removeCloseFriend(userId);
      else await unblockUser(userId);
      await loadItems();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users"
          className="h-11 w-full rounded-lg border border-[#dbdbdb] px-3 text-sm outline-none focus:border-[#a8a8a8]"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[#dbdbdb]">
          {results.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <UserRow user={user} />
              <button
                type="button"
                disabled={savingId === user.id || listedUserIds.has(String(user.id))}
                onClick={() => addUser(user.id)}
                className="rounded-lg bg-[#0095f6] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
              >
                {listedUserIds.has(String(user.id)) ? "Added" : isCloseFriends ? "Add" : "Block"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-[#dbdbdb]">
        {loading ? (
          <p className="p-4 text-sm text-[#737373]">Loading...</p>
        ) : listedUsers.length === 0 ? (
          <p className="p-4 text-sm text-[#737373]">No users found.</p>
        ) : (
          listedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 border-b border-[#efefef] px-4 py-3 last:border-b-0">
              <UserRow user={user} />
              <button
                type="button"
                disabled={savingId === user.id}
                onClick={() => removeUser(user.id)}
                className="rounded-lg border border-[#dbdbdb] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                {isCloseFriends ? "Remove" : "Unblock"}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function UserRow({ user }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={getAvatarUrl(user)} alt="" className="h-10 w-10 rounded-full object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="truncate text-xs text-[#737373]">{user.fullName}</p>
      </div>
    </div>
  );
}

function AccountPrivacyToggle({ currentUser }) {
  const [isPrivate, setIsPrivate] = useState(Boolean(currentUser?.isPrivate));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsPrivate(Boolean(currentUser?.isPrivate));
  }, [currentUser?.isPrivate]);

  const handleToggle = async () => {
    const nextValue = !isPrivate;
    setSaving(true);
    try {
      await updateProfile({
        fullName: currentUser?.fullName,
        username: currentUser?.username,
        bio: currentUser?.bio,
        gender: currentUser?.gender,
        website: currentUser?.website,
        email: currentUser?.email,
        isPrivate: nextValue,
      });
      setIsPrivate(nextValue);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#dbdbdb] p-4">
      <div>
        <p className="text-sm font-semibold">Private account</p>
        <p className="mt-1 text-xs text-[#737373]">Saved with PUT /api/users/profile.</p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving || !currentUser?.id}
        className={`relative h-6 w-11 rounded-full transition-colors ${isPrivate ? "bg-[#0095f6]" : "bg-[#dbdbdb]"} disabled:opacity-50`}
        aria-pressed={isPrivate}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${isPrivate ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function StoryLocationSettings({ currentUserId }) {
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadHiddenUsers = async () => {
    setLoading(true);
    try {
      setHiddenUsers(await getHiddenStoryUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHiddenUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      const data = await searchUsers(trimmed);
      setResults((Array.isArray(data) ? data : []).filter((user) => user.id !== currentUserId));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  const hiddenIds = new Set(hiddenUsers.map((user) => String(user.id)));

  const addUser = async (userId) => {
    setSavingId(userId);
    try {
      await addHiddenStoryUser(userId);
      setQuery("");
      setResults([]);
      await loadHiddenUsers();
    } finally {
      setSavingId(null);
    }
  };

  const removeUser = async (userId) => {
    setSavingId(userId);
    try {
      await removeHiddenStoryUser(userId);
      await loadHiddenUsers();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Story and Location</h1>
      <section className="mt-6">
        <h2 className="text-sm font-bold">Hide story and live from</h2>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="mt-4 h-11 w-full rounded-lg border border-[#dbdbdb] px-3 text-sm outline-none focus:border-[#a8a8a8]" />

        {results.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#dbdbdb]">
            {results.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <UserRow user={user} />
                <button type="button" disabled={savingId === user.id || hiddenIds.has(String(user.id))} onClick={() => addUser(user.id)} className="rounded-lg bg-[#0095f6] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
                  {hiddenIds.has(String(user.id)) ? "Hidden" : "Hide"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-[#dbdbdb]">
          {loading ? (
            <p className="p-4 text-sm text-[#737373]">Loading...</p>
          ) : hiddenUsers.length === 0 ? (
            <p className="p-4 text-sm text-[#737373]">No hidden users.</p>
          ) : (
            hiddenUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 border-b border-[#efefef] px-4 py-3 last:border-b-0">
                <UserRow user={user} />
                <button type="button" disabled={savingId === user.id} onClick={() => removeUser(user.id)} className="rounded-lg border border-[#dbdbdb] px-3 py-1.5 text-xs font-bold disabled:opacity-40">
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

function MessageStoryReplySettings() {
  const [settings, setSettings] = useState({
    messageRequestPermission: "EVERYONE",
    storyReplyPermission: "EVERYONE",
    showActivityStatus: true,
    onlineVisibility: "EVERYONE",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMessagePrivacySettings()
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .finally(() => setLoading(false));
  }, []);

  const save = async (nextSettings) => {
    setSettings(nextSettings);
    setSaving(true);
    try {
      const saved = await updateMessagePrivacySettings(nextSettings);
      setSettings((prev) => ({ ...prev, ...saved }));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => save({ ...settings, [field]: value });

  if (loading) return <p className="text-sm text-[#737373]">Loading...</p>;

  return (
    <>
      <h1 className="text-2xl font-bold">Messages and Story Replies</h1>
      <div className="mt-6 space-y-6">
        <SettingRadioGroup title="How people can reach you" value={settings.messageRequestPermission} onChange={(value) => updateField("messageRequestPermission", value)} options={[["EVERYONE", "Everyone"], ["FOLLOWERS", "People you follow"], ["NO_ONE", "No one"]]} />
        <SettingRadioGroup title="Story replies" value={settings.storyReplyPermission} onChange={(value) => updateField("storyReplyPermission", value)} options={[["EVERYONE", "Everyone"], ["FOLLOWERS", "People you follow"], ["NO_ONE", "No one"]]} />
        <SettingRadioGroup title="Who can see you're online" value={settings.onlineVisibility} onChange={(value) => updateField("onlineVisibility", value)} options={[["EVERYONE", "Everyone"], ["FOLLOWERS", "People you follow"], ["NO_ONE", "No one"]]} />
        <div className="flex items-center justify-between rounded-lg border border-[#dbdbdb] p-4">
          <div>
            <p className="text-sm font-semibold">Show activity status</p>
            <p className="mt-1 text-xs text-[#737373]">{saving ? "Saving..." : "Saved to backend"}</p>
          </div>
          <button type="button" onClick={() => updateField("showActivityStatus", !settings.showActivityStatus)} className={`relative h-6 w-11 rounded-full ${settings.showActivityStatus ? "bg-[#0095f6]" : "bg-[#dbdbdb]"}`} aria-pressed={settings.showActivityStatus}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${settings.showActivityStatus ? "translate-x-5" : "translate-x-1"}`} />
          </button>
        </div>
      </div>
    </>
  );
}

function SettingRadioGroup({ title, value, onChange, options }) {
  return (
    <section className="rounded-lg border border-[#dbdbdb] p-4">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-3 space-y-2">
        {options.map(([optionValue, label]) => (
          <label key={optionValue} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-[#fafafa]">
            <span>{label}</span>
            <input type="radio" name={title} checked={value === optionValue} onChange={() => onChange(optionValue)} />
          </label>
        ))}
      </div>
    </section>
  );
}

function SettingsPage() {
  const { section = "" } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const profileUrl = useMemo(() => {
    if (!currentUser?.id) return "";
    return `${window.location.origin}/profile/${currentUser.id}`;
  }, [currentUser?.id]);

  const handleLogout = () => {
    logoutUser();
    clearCurrentUserCache();
    navigate("/login", { replace: true });
  };

  const downloadQr = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(currentUser?.username || "Instagram profile", 320, 250);
    ctx.font = "18px Arial";
    ctx.fillText(profileUrl, 320, 310);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 12;
    ctx.strokeRect(90, 90, 460, 460);
    const link = document.createElement("a");
    link.download = `${currentUser?.username || "profile"}-profile.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const content = {
    "": (
      <>
        <h1 className="text-2xl font-bold">Settings and Privacy</h1>
        <div className="mt-6 space-y-3 text-sm">
          <NavLink to="/settings/privacy" className="block rounded-lg border border-[#dbdbdb] p-4 font-semibold hover:bg-[#fafafa]">
            Privacy, password, blocked users, and close friends
          </NavLink>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg border border-[#dbdbdb] p-4 font-semibold text-[#ed4956] hover:bg-[#fafafa]">
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </>
    ),
    "apps-and-websites": (
      <>
        <h1 className="text-2xl font-bold">Apps and Websites</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["Active Apps", "Expired Apps", "Removed Apps"].map((label) => (
            <div key={label} className="rounded-lg border border-[#dbdbdb] p-4 text-sm font-semibold">{label}</div>
          ))}
        </div>
        <div className="mt-4"><MissingEndpoint endpoints={["GET /api/settings/apps", "DELETE /api/settings/apps/{id}"]} /></div>
      </>
    ),
    notifications: (
      <>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/settings/notifications", "PUT /api/settings/notifications"]} /></div>
      </>
    ),
    privacy: (
      <>
        <h1 className="text-2xl font-bold">Privacy</h1>
        <div className="mt-6 space-y-3 text-sm text-[#262626]">
          <AccountPrivacyToggle currentUser={currentUser} />
          <div className="rounded-lg border border-[#dbdbdb] p-4">Supported backend APIs found: PUT /api/users/profile, PUT /api/users/password, GET /api/users/blocked, GET /api/close-friends.</div>
          <MissingEndpoint endpoints={["dedicated privacy settings read endpoint"]} />
        </div>
      </>
    ),
    "close-friends": <UserListSettings title="Close Friends" type="close-friends" currentUserId={currentUser?.id} />,
    "blocked-accounts": <UserListSettings title="Blocked Accounts" type="blocked-accounts" currentUserId={currentUser?.id} />,
    "story-location": <StoryLocationSettings currentUserId={currentUser?.id} />,
    "messages-replies": <MessageStoryReplySettings />,
    "restricted-accounts": (
      <>
        <h1 className="text-2xl font-bold">Restricted Accounts</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/users/restricted", "POST /api/users/{userId}/restrict", "DELETE /api/users/{userId}/restrict"]} /></div>
      </>
    ),
    "tags-mentions": (
      <>
        <h1 className="text-2xl font-bold">Tags and Mentions</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/settings/tags-mentions", "PUT /api/settings/tags-mentions"]} /></div>
      </>
    ),
    comments: (
      <>
        <h1 className="text-2xl font-bold">Comments</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/settings/comments", "PUT /api/settings/comments"]} /></div>
      </>
    ),
    "sharing-reuse": (
      <>
        <h1 className="text-2xl font-bold">Sharing and Reuse</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/settings/sharing-reuse", "PUT /api/settings/sharing-reuse"]} /></div>
      </>
    ),
    "meta-verified": (
      <>
        <h1 className="text-2xl font-bold">Meta Verified</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/meta-verified"]} /></div>
      </>
    ),
    supervision: (
      <>
        <h1 className="text-2xl font-bold">Supervision</h1>
        <div className="mt-6"><MissingEndpoint endpoints={["GET /api/supervision"]} /></div>
      </>
    ),
    "login-activity": (
      <>
        <h1 className="text-2xl font-bold">Login Activity</h1>
        <div className="mt-6 space-y-4">
          <button type="button" onClick={handleLogout} className="rounded-lg bg-[#ed4956] px-4 py-2 text-sm font-bold text-white">
            Log out current session
          </button>
          <MissingEndpoint endpoints={["GET /api/sessions", "DELETE /api/sessions/{id}"]} />
        </div>
      </>
    ),
    "qr-code": (
      <>
        <h1 className="text-2xl font-bold">QR Code</h1>
        <div className="mt-6 max-w-sm rounded-xl border border-[#dbdbdb] p-6 text-center">
          <div className="mx-auto flex aspect-square w-56 items-center justify-center rounded-lg border-8 border-black bg-white p-4 text-xs font-bold break-all">
            {profileUrl}
          </div>
          <p className="mt-4 text-sm font-semibold">@{currentUser?.username}</p>
          <button type="button" onClick={downloadQr} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-bold text-white">
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </>
    ),
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid max-w-[1000px] grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#dbdbdb] p-6">
          <h2 className="mb-4 text-xl font-bold">Settings</h2>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.label}
                to={item.slug ? `/settings/${item.slug}` : "/settings"}
                end={!item.slug}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? "bg-[#efefef]" : "hover:bg-[#fafafa]"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="p-6 md:p-10">{content[section] || <MissingEndpoint endpoints={[`/settings/${section}`]} />}</section>
      </div>
    </main>
  );
}

export default SettingsPage;
