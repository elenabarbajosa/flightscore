import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildDealResolutionRedisKey,
  createDealCacheForTests,
  DEAL_RESOLUTION_CACHE_NAMESPACE,
  resetDefaultDealCacheForTests,
} from "@/lib/deal/cache";

describe("deal cache", () => {
  afterEach(() => {
    resetDefaultDealCacheForTests();
  });

  it("stores successful resolutions keyed by hashed dealReference", async () => {
    const cache = createDealCacheForTests(300);

    await cache.set("raw-token-value", {
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });

    expect(await cache.get("raw-token-value")).toEqual({
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });
    expect(buildDealResolutionRedisKey("raw-token-value")).toMatch(
      new RegExp(`^${DEAL_RESOLUTION_CACHE_NAMESPACE}[a-f0-9]{64}$`),
    );
  });

  it("expires cached resolutions after the configured TTL", async () => {
    vi.useFakeTimers();
    const cache = createDealCacheForTests(1);

    await cache.set("raw-token-value", {
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });

    vi.advanceTimersByTime(1100);

    expect(await cache.get("raw-token-value")).toBeNull();
    vi.useRealTimers();
  });
});
