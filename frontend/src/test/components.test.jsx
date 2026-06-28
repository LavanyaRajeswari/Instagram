import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  unwrapPage: (d) => d,
  getAuthToken: () => "",
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  normalizeAuthResponse: (d) => ({ token: d?.token, user: d }),
  API_BASE_URL: "http://localhost:8080/api",
}));

vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn(() => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
    connected: false,
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    publish: vi.fn(),
    onConnect: null,
    onDisconnect: null,
    onStompError: null,
  })),
}));

function withRouter(ui) {
  return <MemoryRouter>{ui}</MemoryRouter>;
}

describe("LinkedText", () => {
  it("renders text and links", async () => {
    const LinkedText = (await import("../components/LinkedText")).default;
    render(withRouter(<LinkedText text="Hello #world @user" />));
    expect(screen.getByText("Hello")).toBeTruthy();
    expect(screen.getByText("#world")).toBeTruthy();
    expect(screen.getByText("@user")).toBeTruthy();
  });

  it("renders plain text with no matches", async () => {
    const LinkedText = (await import("../components/LinkedText")).default;
    render(withRouter(<LinkedText text="Just plain text" />));
    expect(screen.getByText("Just plain text")).toBeTruthy();
  });
});

describe("MentionSuggestions", () => {
  it("renders nothing when query is empty", async () => {
    const MentionSuggestions = (await import("../components/MentionSuggestions")).default;
    const { container } = render(
      <MentionSuggestions query="" onSelect={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders suggestions when API returns results", async () => {
    const { api } = await import("../api/client");
    api.get.mockResolvedValueOnce({ data: [{ id: 1, username: "alice", fullName: "Alice", profilePicture: "" }] });
    const MentionSuggestions = (await import("../components/MentionSuggestions")).default;
    render(
      <MentionSuggestions query="ali" onSelect={vi.fn()} />
    );
    const element = await screen.findByText("alice", {}, { timeout: 1000 });
    expect(element).toBeTruthy();
  });
});

describe("GettingStarted", () => {
  it("renders without crashing", async () => {
    const GettingStarted = (await import("../components/profile/GettingStarted")).default;
    render(withRouter(<GettingStarted />));
    expect(screen.getByText("Getting Started")).toBeTruthy();
  });
});

describe("Sidebar import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/Sidebar");
    expect(mod.default).toBeDefined();
  });
});

describe("ShareModal import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/ShareModal");
    expect(mod.default).toBeDefined();
  });
});

describe("LikesModal", () => {
  it("imports without error", async () => {
    const mod = await import("../components/LikesModal");
    expect(mod.default).toBeDefined();
  });
});

describe("StoriesBar import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/StoriesBar");
    expect(mod.default).toBeDefined();
  });
});

describe("StoryViewer import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/StoryViewer");
    expect(mod.default).toBeDefined();
  });
});

describe("ProfileHeader import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/profile/ProfileHeader");
    expect(mod.default).toBeDefined();
  });
});

describe("ProfileTabs import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/profile/ProfileTabs");
    expect(mod.default).toBeDefined();
  });
});

describe("ProfileNote import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/profile/ProfileNote");
    expect(mod.default).toBeDefined();
  });
});

describe("ProfileHighlights import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/profile/ProfileHighlights");
    expect(mod.default).toBeDefined();
  });
});


describe("IncomingCallProvider import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/IncomingCallProvider");
    expect(mod.default).toBeDefined();
  });
});

describe("PostCard import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/PostCard");
    expect(mod.default).toBeDefined();
  });
});

describe("CreatePostModal import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/CreatePostModal");
    expect(mod.default).toBeDefined();
  });
});

describe("CreateStoryModal import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/CreateStoryModal");
    expect(mod.default).toBeDefined();
  });
});

describe("MiniMessenger import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/MiniMessenger");
    expect(mod.default).toBeDefined();
  });
});

describe("ImmersivePostModal import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/ImmersivePostModal");
    expect(mod.default).toBeDefined();
  });
});

describe("FollowersModal import check", () => {
  it("imports without error", async () => {
    const mod = await import("../components/profile/FollowersModal");
    expect(mod.default).toBeDefined();
  });
});

describe("Page imports", () => {
  const pages = {
    Home: () => import("../pages/Home"),
    Login: () => import("../pages/auth/Login"),
    Register: () => import("../pages/auth/Register"),
    Messages: () => import("../pages/Messages"),
    Notifications: () => import("../pages/Notifications"),
    Search: () => import("../pages/Search"),
    Reels: () => import("../pages/Reels"),
    SavedPosts: () => import("../pages/SavedPosts"),
    PostPage: () => import("../pages/PostPage"),
    HashtagPage: () => import("../pages/HashtagPage"),
    CallPage: () => import("../pages/CallPage"),
    ProfilePage: () => import("../pages/profile/ProfilePage"),
    EditProfilePage: () => import("../pages/profile/EditProfilePage"),
    SettingsPage: () => import("../pages/settings/SettingsPage"),
  };

  it.each(Object.entries(pages))("%s imports without error", async (name, imp) => {
    const mod = await imp();
    expect(mod.default).toBeDefined();
  });
});

describe("useWebSocket exports correctly", () => {
  it("all exports are functions", async () => {
    const mod = await import("../hooks/useWebSocket");
    expect(typeof mod.useWebSocket).toBe("function");
    expect(typeof mod.subscribe).toBe("function");
    expect(typeof mod.send).toBe("function");
    expect(typeof mod.connect).toBe("function");
    expect(typeof mod.disconnect).toBe("function");
    expect(typeof mod.subscribeToNotifications).toBe("function");
    expect(typeof mod.subscribeToChat).toBe("function");
    expect(typeof mod.subscribeToTyping).toBe("function");
    expect(typeof mod.sendTyping).toBe("function");
    expect(typeof mod.sendChatMessage).toBe("function");
  });
});

describe("Config and helper imports", () => {
  it("avatar util exports correctly", async () => {
    const mod = await import("../utils/avatar");
    expect(typeof mod.getAvatarUrl).toBe("function");
  });
});
