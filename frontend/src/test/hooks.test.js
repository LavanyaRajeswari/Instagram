import { describe, it, expect } from "vitest";

describe("useCurrentUser module", () => {
  it("exports useCurrentUser and clearCurrentUserCache as functions", async () => {
    const mod = await import("../hooks/useCurrentUser");
    expect(typeof mod.useCurrentUser).toBe("function");
    expect(typeof mod.clearCurrentUserCache).toBe("function");
  });
});

describe("avatar util", () => {
  it("exports getAvatarUrl", async () => {
    const mod = await import("../utils/avatar");
    expect(typeof mod.getAvatarUrl).toBe("function");
  });

  it("getAvatarUrl returns fallback for empty input", async () => {
    const { getAvatarUrl } = await import("../utils/avatar");
    const url = getAvatarUrl(null, "Alice");
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });
});
