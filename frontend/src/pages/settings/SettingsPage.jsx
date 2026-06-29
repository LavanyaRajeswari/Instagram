import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Moon, Sun } from "lucide-react";

import { searchUsers } from "../../api/userApi";
import { useTheme } from "../../context/ThemeContext";
import {
  addHiddenStoryUser,
  blockUser,
  getBlockedAccounts,
  getHiddenStoryUsers,
  getMessagePrivacySettings,
  getNotificationSettings,
  getRestrictedAccounts,
  getSettings,
  removeHiddenStoryUser,
  restrictUser,
  unRestrictUser,
  unblockUser,
  updateMessagePrivacySettings,
  updateNotificationSettings,
  updatePrivacySetting,
  updateStoryMentions,
  updateStoryReplies,
  getActivity,
} from "../../api/settingsApi";
import { useCurrentUser, clearCurrentUserCache } from "../../hooks/useCurrentUser";
import { getAvatarUrl } from "../../utils/avatar";
import EditProfilePage from "../profile/EditProfilePage";

const items = [
  { slug: "edit-profile", label: "Edit Profile" },
  { slug: "notifications", label: "Notifications" },
  { slug: "privacy", label: "Privacy" },
  { slug: "blocked-accounts", label: "Blocked Accounts" },
  { slug: "story-location", label: "Story" },
  { slug: "messages-replies", label: "Messages and Story Replies" },
  { slug: "restricted-accounts", label: "Restricted Accounts" },
  { slug: "tags-mentions", label: "Tags and Mentions" },
  { slug: "comments", label: "Comments" },
  { slug: "appearance", label: "Appearance" },
  { slug: "activity", label: "Your Activity" },
];

function MissingEndpoint({ endpoints }) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
      Backend endpoint missing: {endpoints.join(", ")}
    </div>
  );
}

const normalizeUser = (item, key) => item?.[key] || item?.user || item;

function UserListSettings({ title, currentUserId }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getBlockedAccounts();
      setItems(data);
    } catch (error) {
     
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

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
       
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  const listedUsers = items.map((item) => normalizeUser(item, "blocked")).filter(Boolean);
  const listedUserIds = new Set(listedUsers.map((user) => String(user.id)));

  const addUser = async (userId) => {
    setSavingId(userId);
    try {
      await blockUser(userId);
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
      await unblockUser(userId);
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
          className="h-11 w-full rounded-lg border border-[var(--border-primary)] px-3 text-sm outline-none focus:border-[var(--text-secondary)]"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border-primary)]">
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

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border-primary)]">
        {loading ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">Loading...</p>
        ) : listedUsers.length === 0 ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">No users found.</p>
        ) : (
          listedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 border-b border-[var(--border-secondary)] px-4 py-3 last:border-b-0">
              <UserRow user={user} />
              <button
                type="button"
                disabled={savingId === user.id}
                onClick={() => removeUser(user.id)}
                className="rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
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
  const navigate = useNavigate();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={() => navigate(`/profile/${user.id}`)} className="shrink-0">
        <img src={getAvatarUrl(user)} alt="" className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="truncate text-xs text-[var(--text-secondary)]">{user.fullName}</p>
      </div>
    </div>
  );
}

function NotificationSettingsComponent() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getNotificationSettings()
      .then((data) => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (field) => {
    const nextValue = !settings[field];
    setSaving(field);
    setSettings((prev) => ({ ...prev, [field]: nextValue }));
    try {
      const saved = await updateNotificationSettings({ [field]: nextValue });
      setSettings((prev) => ({ ...prev, ...saved }));
    } catch {
      setSettings((prev) => ({ ...prev, [field]: !nextValue }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading...</p>;

  const toggles = [
    { key: "pushEnabled", label: "Push notifications" },
    { key: "likesEnabled", label: "Likes" },
    { key: "commentsEnabled", label: "Comments" },
    { key: "followsEnabled", label: "Follow requests" },
    { key: "mentionsEnabled", label: "Mentions" },
    { key: "messagesEnabled", label: "Messages" },
    { key: "storiesEnabled", label: "Stories" },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="mt-6 space-y-3">
        {toggles.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] p-4">
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {saving === key ? "Saving..." : settings?.[key] ? "Enabled" : "Disabled"}
              </p>
            </div>
            <ToggleButton checked={Boolean(settings?.[key])} disabled={saving === key} onClick={() => toggle(key)} />
          </div>
        ))}
      </div>
    </>
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
    setIsPrivate(nextValue);
    setSaving(true);
    try {
      await updatePrivacySetting("isPrivate", nextValue);
      clearCurrentUserCache();
    } catch {
      setIsPrivate(!nextValue);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-primary)] p-4">
      <div>
        <p className="text-sm font-semibold">Private account</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {saving ? "Saving..." : isPrivate ? "Only your followers can see your posts" : "Anyone can see your posts"}
        </p>
      </div>
      <ToggleButton checked={isPrivate} disabled={saving || !currentUser?.id} onClick={handleToggle} />
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

  const hiddenIds = new Set(hiddenUsers.map((user) => String(user.userId)));

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
      <h1 className="text-2xl font-bold">Story</h1>
      <section className="mt-6">
        <h2 className="text-sm font-bold">Hide story from</h2>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="mt-4 h-11 w-full rounded-lg border border-[var(--border-primary)] px-3 text-sm outline-none focus:border-[var(--text-secondary)]" />

        {results.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border-primary)]">
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

        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border-primary)]">
          {loading ? (
            <p className="p-4 text-sm text-[var(--text-secondary)]">Loading...</p>
          ) : hiddenUsers.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-secondary)]">No hidden users.</p>
          ) : (
            hiddenUsers.map((user) => (
              <div key={user.userId} className="flex items-center justify-between gap-3 border-b border-[var(--border-secondary)] px-4 py-3 last:border-b-0">
                <UserRow user={{ ...user, id: user.userId }} />
                <button type="button" disabled={savingId === user.userId} onClick={() => removeUser(user.userId)} className="rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs font-bold disabled:opacity-40">
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
    storyRepliesEnabled: true,
    storyMentionsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getMessagePrivacySettings()
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (field) => {
    const nextValue = !settings[field];
    setSaving(field);
    setSettings((prev) => ({ ...prev, [field]: nextValue }));
    try {
      await updateMessagePrivacySettings({ [field]: nextValue });
    } catch {
      setSettings((prev) => ({ ...prev, [field]: !nextValue }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-sm text-[var(--text-secondary)]">Loading...</p>;

  const toggles = [
    { key: "storyRepliesEnabled", label: "Allow story replies", desc: "Let people reply to your stories" },
    { key: "storyMentionsEnabled", label: "Allow story mentions", desc: "Let people mention you in their stories" },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Messages and Story Replies</h1>
      <div className="mt-6 space-y-3">
        {toggles.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-primary)] p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{saving === key ? "Saving..." : desc}</p>
            </div>
            <ToggleButton checked={settings[key]} disabled={saving === key} onClick={() => toggle(key)} />
          </div>
        ))}
      </div>
    </>
  );
}

function ToggleButton({ checked, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-1 transition-colors duration-200 ${
        checked
          ? "border-[#0095f6] bg-[#0095f6]"
          : "border-[var(--border-primary)] bg-[var(--bg-secondary)]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      aria-pressed={checked}
      aria-label={checked ? "On" : "Off"}
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6 text-[#0095f6]" : "translate-x-0 text-secondary"
        }`}
      >
        {checked ? "ON" : ""}
      </span>
    </button>
  );
}

function PrivacySettings({ currentUser }) {
  const [settings, setSettings] = useState({
    activityStatus: currentUser?.activityStatus !== false,
    readReceipts: currentUser?.readReceipts !== false,
  });
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings({
          activityStatus: s?.activityStatus !== false,
          readReceipts: s?.readReceipts !== false,
        });
      })
      .catch(() => {
        setSettings({
          activityStatus: currentUser?.activityStatus !== false,
          readReceipts: currentUser?.readReceipts !== false,
        });
      });
  }, []);

  const toggle = async (setting) => {
    const nextValue = !settings[setting];
    setSettings((prev) => ({ ...prev, [setting]: nextValue }));
    setSaving(setting);
    try {
      await updatePrivacySetting(setting, nextValue);
    } catch {
      setSettings((prev) => ({ ...prev, [setting]: !nextValue }));
    } finally {
      setSaving(null);
    }
  };

  const toggles = [
    { key: "activityStatus", label: "Show activity status", desc: "Let people see when you're active or recently active" },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Privacy</h1>
      <div className="mt-6 space-y-3 text-sm text-[var(--text-primary)]">
        <AccountPrivacyToggle currentUser={currentUser} />
        {toggles.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-primary)] p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{desc}</p>
            </div>
            <ToggleButton checked={settings[key]} disabled={saving === key} onClick={() => toggle(key)} />
          </div>
        ))}
      </div>
    </>
  );
}

function TagsMentionsSettings() {
  const [allowMentions, setAllowMentions] = useState(true);
  const [allowReplies, setAllowReplies] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getSettings().then((s) => {
      if (s?.storyMentionsEnabled !== undefined) setAllowMentions(Boolean(s.storyMentionsEnabled));
      if (s?.storyRepliesEnabled !== undefined) setAllowReplies(Boolean(s.storyRepliesEnabled));
    }).catch(() => {});
  }, []);

  const toggleMentions = async () => {
    const next = !allowMentions;
    setAllowMentions(next);
    setSaving("mentions");
    try {
      await updateStoryMentions(next);
    } catch {
      setAllowMentions(!next);
    } finally {
      setSaving(null);
    }
  };

  const toggleReplies = async () => {
    const next = !allowReplies;
    setAllowReplies(next);
    setSaving("replies");
    try {
      await updateStoryReplies(next);
    } catch {
      setAllowReplies(!next);
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Tags and Mentions</h1>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-primary)] p-4">
          <div>
            <p className="text-sm font-semibold">Allow mentions from stories</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Let people mention you in their stories</p>
          </div>
          <ToggleButton checked={allowMentions} disabled={saving === "mentions"} onClick={toggleMentions} />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-primary)] p-4">
          <div>
            <p className="text-sm font-semibold">Allow story replies</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Let people reply to your stories</p>
          </div>
          <ToggleButton checked={allowReplies} disabled={saving === "replies"} onClick={toggleReplies} />
        </div>
      </div>
    </>
  );
}

function CommentsSettings() {
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    getSettings().then((s) => {
      if (s?.commentsDisabled !== undefined) setCommentsDisabled(Boolean(s.commentsDisabled));
    }).catch(() => {});
  }, []);

  const toggleComments = async () => {
    const next = !commentsDisabled;
    setCommentsDisabled(next);
    setSaving("commentsDisabled");
    try {
      await updatePrivacySetting("commentsDisabled", next);
      clearCurrentUserCache();
    } catch {
      setCommentsDisabled(!next);
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Comments</h1>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-primary)] p-4">
          <div>
            <p className="text-sm font-semibold">Hide comments</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Comments are restricted and the comment button is disabled on your posts.
            </p>
          </div>
          <ToggleButton checked={commentsDisabled} disabled={saving === "commentsDisabled"} onClick={toggleComments} />
        </div>
      </div>
    </>
  );
}

function RestrictedListSettings({ currentUserId }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getRestrictedAccounts();
      setItems(data);
    } catch (error) {
     
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

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
       
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  const listedUsers = items.map((item) => normalizeUser(item, "restricted")).filter(Boolean);
  const listedUserIds = new Set(listedUsers.map((user) => String(user.id)));

  const addUser = async (userId) => {
    setSavingId(userId);
    try {
      await restrictUser(userId);
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
      await unRestrictUser(userId);
      await loadItems();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Restricted Accounts</h1>
      <div className="mt-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users"
          className="h-11 w-full rounded-lg border border-[var(--border-primary)] px-3 text-sm outline-none focus:border-[var(--text-secondary)]"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border-primary)]">
          {results.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <UserRow user={user} />
              <button
                type="button"
                disabled={savingId === user.id || listedUserIds.has(String(user.id))}
                onClick={() => addUser(user.id)}
                className="rounded-lg bg-[#0095f6] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
              >
                {listedUserIds.has(String(user.id)) ? "Restricted" : "Restrict"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border-primary)]">
        {loading ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">Loading...</p>
        ) : listedUsers.length === 0 ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">No restricted accounts.</p>
        ) : (
          listedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 border-b border-[var(--border-secondary)] px-4 py-3 last:border-b-0">
              <UserRow user={user} />
              <button
                type="button"
                disabled={savingId === user.id}
                onClick={() => removeUser(user.id)}
                className="rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                Unrestrict
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const handleChange = async (value) => {
    setSaving(true);
    try {
      setTheme(value);
    } catch {  } finally {
      setSaving(false);
    }
  };

  const options = [
    { value: "LIGHT", label: "Light", icon: Sun },
    { value: "DARK", label: "Dark", icon: Moon },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Appearance</h1>
      <div className="mt-6 space-y-3">
        <div className="rounded-lg border border-[var(--border-primary)] p-4">
          <p className="mb-4 text-sm font-semibold">Theme</p>
          <div className="space-y-3">
            {options.map(({ value, label, icon: Icon }) => {
              const isActive = theme === value.toLowerCase();
              return (
                <div
                  key={value}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${isActive ? "border-[var(--text-link)] bg-[var(--hover-bg)]" : "border-[var(--border-primary)] hover:bg-[var(--hover-bg)]"}`}
                  onClick={() => handleChange(value)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? "text-[var(--text-link)]" : "text-[var(--text-secondary)]"} />
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{label}</p>
                    </div>
                  </div>
                  {isActive && <div className="h-2.5 w-2.5 rounded-full bg-[var(--text-link)]" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function ActivitySettings() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getActivity()
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const getActivityText = (item) => {
    const actor = item.actorUsername || "Someone";
    const type = String(item.type || "").toUpperCase();
    if (type.includes("LIKE")) return { text: `${actor} liked your post.`, icon: "❤️" };
    if (type.includes("COMMENT")) return { text: `${actor} commented: ${item.commentText || ""}`, icon: "💬" };
    if (type.includes("FOLLOW")) return { text: `${actor} started following you.`, icon: "👤" };
    if (type.includes("MESSAGE")) return { text: `${actor} sent you a message.`, icon: "✉️" };
    return { text: `${actor} interacted with you.`, icon: "🔔" };
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Your Activity</h1>
      {loading ? (
        <p className="mt-6 text-sm text-[var(--text-secondary)]">Loading activity...</p>
      ) : activities.length === 0 ? (
        <div className="mt-6 rounded-lg border border-[var(--border-primary)] p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No recent activity.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-[var(--border-secondary)] rounded-lg border border-[var(--border-primary)]">
          {activities.map((item) => {
            const { text, icon } = getActivityText(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const type = String(item.type || "").toUpperCase();
                  if ((type.includes("LIKE") || type.includes("COMMENT")) && item.postId) {
                    navigate(`/post/${item.postId}`);
                  } else if (item.actorId) {
                    navigate(`/profile/${item.actorId}`);
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--hover-bg)]"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--border-secondary)] flex items-center justify-center text-sm">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{text}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function SettingsPage() {
  const { section = "" } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const content = {
    "": <div className="overflow-auto"><EditProfilePage /></div>,
    "edit-profile": <div className="overflow-auto"><EditProfilePage /></div>,
    notifications: <NotificationSettingsComponent />,
    privacy: <PrivacySettings currentUser={currentUser} />,
    "blocked-accounts": <UserListSettings title="Blocked Accounts" currentUserId={currentUser?.id} />,
    "story-location": <StoryLocationSettings currentUserId={currentUser?.id} />,
    "messages-replies": <MessageStoryReplySettings />,
    "restricted-accounts": <RestrictedListSettings currentUserId={currentUser?.id} />,
    "tags-mentions": <TagsMentionsSettings />,
    comments: <CommentsSettings />,
    appearance: <AppearanceSettings />,
    activity: <ActivitySettings />,
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 md:grid-cols-[260px_1fr] md:pt-0">
        <aside className="border-r border-[var(--border-primary)] p-4 md:p-6" style={{ backgroundColor: "var(--bg-primary)" }}>
          <h2 className="mb-4 text-lg font-bold">Settings</h2>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.label}
                to={item.slug ? `/settings/${item.slug}` : "/settings"}
                end={!item.slug}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="p-6 md:p-8" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
          {section && section !== "edit-profile" && (
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          {content[section] || <MissingEndpoint endpoints={[`/settings/${section}`]} />}
        </section>
      </div>
    </main>
  );
}

export default SettingsPage;
