import { vi } from "vitest";

export const mockUser = {
  id: 1,
  username: "alice",
  fullName: "Alice Smith",
  email: "alice@example.com",
  profilePicture: "https://i.pravatar.cc/200?u=alice",
  bio: "Hello!",
  website: "https://alice.dev",
  verified: false,
  private: false,
};

export const mockPost = {
  id: 10,
  caption: "Test post #nature",
  imageUrl: "https://picsum.photos/seed/10/640/640",
  createdAt: "2025-01-15T10:00:00",
  likeCount: 5,
  commentCount: 2,
  liked: false,
  saved: false,
  user: { id: 2, username: "bob", fullName: "Bob Jones", profilePicture: "https://i.pravatar.cc/200?u=bob" },
};

export function mockUseCurrentUser(overrides = {}) {
  const defaultVal = {
    currentUser: mockUser,
    currentUserId: mockUser.id,
    currentUserLoading: false,
  };
  vi.mock("../hooks/useCurrentUser", () => ({
    useCurrentUser: () => ({ ...defaultVal, ...overrides }),
    clearCurrentUserCache: vi.fn(),
  }));
}

export function mockReactRouter(overrides = {}) {
  vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
      ...actual,
      useParams: () => overrides.params || {},
      useNavigate: () => vi.fn(),
      useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
      Link: actual.Link,
      Navigate: actual.Navigate,
      Routes: actual.Routes,
      Route: actual.Route,
    };
  });
}
