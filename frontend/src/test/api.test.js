import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../api/client", () => ({
  api: mockApi,
  unwrapPage: (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return data || [];
  },
  getAuthToken: () => "test-token",
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  normalizeAuthResponse: (data) => ({ token: data?.token, user: data }),
  API_BASE_URL: "http://localhost:8080/api",
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("API modules — import and function shape", () => {
  const apiModules = {
    callsApi: () => import("../api/callsApi"),

    commentsApi: () => import("../api/commentsApi"),
    followApi: () => import("../api/followApi"),
    followRequestsApi: () => import("../api/followRequestsApi"),
    hashtagsApi: () => import("../api/hashtagsApi"),
    highlightsApi: () => import("../api/highlightsApi"),
    likesApi: () => import("../api/likesApi"),
    messagesApi: () => import("../api/messagesApi"),
    notesApi: () => import("../api/notesApi"),
    notificationsApi: () => import("../api/notificationsApi"),
    postInteractionApi: () => import("../api/postInteractionApi"),
    postsApi: () => import("../api/postsApi"),
    reelsApi: () => import("../api/reelsApi"),
    reportsApi: () => import("../api/reportsApi"),
    savedPostsApi: () => import("../api/savedPostsApi"),
    settingsApi: () => import("../api/settingsApi"),
    shareApi: () => import("../api/shareApi"),
    storiesApi: () => import("../api/storiesApi"),
    tagsApi: () => import("../api/tagsApi"),
    userApi: () => import("../api/userApi"),
  };

  it.each(Object.entries(apiModules))("%s imports all exports as functions", async (name, imp) => {
    const mod = await imp();
    const exports = Object.keys(mod);
    expect(exports.length).toBeGreaterThan(0);
    for (const key of exports) {
      expect(typeof mod[key]).toBe("function");
    }
  });
});

describe("commentsApi", () => {
  it("addComment sends text as query param", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1, text: "nice" } });
    const { addComment } = await import("../api/commentsApi");
    await addComment(10, "nice");
    expect(mockApi.post).toHaveBeenCalledWith("/posts/10/comments", null, { params: { text: "nice" } });
  });

  it("getComments calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: { content: [{ id: 1 }] } });
    const { getComments } = await import("../api/commentsApi");
    const result = await getComments(10);
    expect(mockApi.get).toHaveBeenCalledWith("/posts/10/comments");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("likeComment POSTs to like endpoint", async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });
    const { likeComment } = await import("../api/commentsApi");
    await likeComment(5);
    expect(mockApi.post).toHaveBeenCalledWith("/posts/comments/5/like");
  });

  it("unlikeComment DELETEs like endpoint", async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    const { unlikeComment } = await import("../api/commentsApi");
    await unlikeComment(5);
    expect(mockApi.delete).toHaveBeenCalledWith("/posts/comments/5/like");
  });
});

describe("postsApi", () => {
  it("getPostById calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: { id: 5 } });
    const { getPostById } = await import("../api/postsApi");
    const result = await getPostById(5);
    expect(mockApi.get).toHaveBeenCalledWith("/posts/5");
    expect(result).toEqual({ id: 5 });
  });

  it("deletePost calls correct endpoint", async () => {
    mockApi.delete.mockResolvedValueOnce({});
    const { deletePost } = await import("../api/postsApi");
    const result = await deletePost(42);
    expect(mockApi.delete).toHaveBeenCalledWith("/posts/42");
    expect(result).toBe(true);
  });

  it("getFeedPosts calls feed endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getFeedPosts } = await import("../api/postsApi");
    await getFeedPosts();
    expect(mockApi.get).toHaveBeenCalledWith("/posts/feed", { params: { page: 0, size: 10 } });
  });
});

describe("likesApi", () => {
  it("likePost calls POST endpoint", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { liked: true } });
    const { likePost } = await import("../api/likesApi");
    await likePost(10);
    expect(mockApi.post).toHaveBeenCalledWith("/posts/10/like");
  });

  it("unlikePost calls DELETE endpoint", async () => {
    mockApi.delete.mockResolvedValueOnce({});
    const { unlikePost } = await import("../api/likesApi");
    await unlikePost(10);
    expect(mockApi.delete).toHaveBeenCalledWith("/posts/10/like");
  });

  it("getLikeCount extracts count", async () => {
    mockApi.get.mockResolvedValueOnce({ data: 42 });
    const { getLikeCount } = await import("../api/likesApi");
    expect(await getLikeCount(1)).toBe(42);
  });
});

describe("notificationsApi", () => {
  it("getUnreadNotificationCount handles plain number", async () => {
    mockApi.get.mockResolvedValueOnce({ data: 5 });
    const { getUnreadNotificationCount } = await import("../api/notificationsApi");
    expect(await getUnreadNotificationCount()).toBe(5);
  });

  it("getUnreadNotificationCount handles object with count", async () => {
    mockApi.get.mockResolvedValueOnce({ data: { count: 3 } });
    const { getUnreadNotificationCount } = await import("../api/notificationsApi");
    expect(await getUnreadNotificationCount()).toBe(3);
  });
});

describe("followApi", () => {
  it("followUser POSTs to /users/{id}/follow", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { following: true } });
    const { followUser } = await import("../api/followApi");
    await followUser(5);
    expect(mockApi.post).toHaveBeenCalledWith("/users/5/follow");
  });

  it("unfollowUser DELETEs /users/{id}/follow", async () => {
    mockApi.delete.mockResolvedValueOnce({});
    const { unfollowUser } = await import("../api/followApi");
    await unfollowUser(5);
    expect(mockApi.delete).toHaveBeenCalledWith("/users/5/follow");
  });
});

describe("savedPostsApi", () => {
  it("savePost POSTs to /posts/{id}/save", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { saved: true } });
    const { savePost } = await import("../api/savedPostsApi");
    await savePost(20);
    expect(mockApi.post).toHaveBeenCalledWith("/posts/20/save");
  });

  it("unsavePost DELETEs /posts/{id}/save", async () => {
    mockApi.delete.mockResolvedValueOnce({});
    const { unsavePost } = await import("../api/savedPostsApi");
    await unsavePost(20);
    expect(mockApi.delete).toHaveBeenCalledWith("/posts/20/save");
  });
});

describe("followRequestsApi", () => {
  it("acceptFollowRequest calls correct endpoint", async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });
    const { acceptFollowRequest } = await import("../api/followRequestsApi");
    await acceptFollowRequest(5);
    expect(mockApi.post).toHaveBeenCalledWith("/follow-requests/5/accept");
  });

  it("rejectFollowRequest calls correct endpoint", async () => {
    mockApi.delete.mockResolvedValueOnce({ data: {} });
    const { rejectFollowRequest } = await import("../api/followRequestsApi");
    await rejectFollowRequest(5);
    expect(mockApi.delete).toHaveBeenCalledWith("/follow-requests/5/reject");
  });
});


describe("storiesApi", () => {
  it("getStories calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getStories } = await import("../api/storiesApi");
    await getStories();
    expect(mockApi.get).toHaveBeenCalledWith("/stories");
  });
});

describe("userApi", () => {
  it("getUser calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: { id: 1, username: "alice" } });
    const { getUser } = await import("../api/userApi");
    await getUser(1);
    expect(mockApi.get).toHaveBeenCalledWith("/users/1");
  });

  it("searchUsers calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { searchUsers } = await import("../api/userApi");
    await searchUsers("alice");
    expect(mockApi.get).toHaveBeenCalledWith("/users/search", { params: { query: "alice" } });
  });
});

describe("tagsApi", () => {
  it("getTaggedPosts calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getTaggedPosts } = await import("../api/tagsApi");
    await getTaggedPosts(5);
    expect(mockApi.get).toHaveBeenCalledWith("/tags/user/5");
  });
});

describe("settingsApi", () => {
  it("getCloseFriends calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getCloseFriends } = await import("../api/settingsApi");
    await getCloseFriends();
    expect(mockApi.get).toHaveBeenCalledWith("/close-friends");
  });

  it("blockUser posts correct endpoint", async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });
    const { blockUser } = await import("../api/settingsApi");
    await blockUser(3);
    expect(mockApi.post).toHaveBeenCalledWith("/users/3/block");
  });
});

describe("reelsApi", () => {
  it("getReels calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: { content: [] } });
    const { getReels } = await import("../api/reelsApi");
    await getReels();
    expect(mockApi.get).toHaveBeenCalledWith("/reels", { params: { page: 0, size: 10 } });
  });
});

describe("messagesApi", () => {
  it("getMessages calls correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });
    const { getMessages } = await import("../api/messagesApi");
    await getMessages(1);
    expect(mockApi.get).toHaveBeenCalledWith("/messages/1", { params: { page: 0, size: 30 } });
  });

  it("sendMessage sends {chatId, content}", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 99 } });
    const { sendMessage } = await import("../api/messagesApi");
    await sendMessage({ chatId: 1, content: "hello" });
    expect(mockApi.post).toHaveBeenCalledWith("/messages", { chatId: 1, content: "hello" });
  });

  it("getChats returns data", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const { getChats } = await import("../api/messagesApi");
    const result = await getChats();
    expect(mockApi.get).toHaveBeenCalledWith("/chats");
    expect(result).toEqual([{ id: 1 }]);
  });
});
