import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildDealContextRedisKey,
  createDealContextCacheForTests,
  DEAL_CONTEXT_CACHE_NAMESPACE,
  resetDefaultDealContextCacheForTests,
} from "@/lib/deal/context-cache";

describe("deal context cache", () => {
  afterEach(() => {
    resetDefaultDealContextCacheForTests();
  });

  it("registers search context keyed by hashed dealReference", async () => {
    const cache = createDealContextCacheForTests(300);

    await cache.register("token-abc", {
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-11-01",
    });

    expect(await cache.get("token-abc")).toEqual({
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-11-01",
    });
    expect(buildDealContextRedisKey("token-abc")).toMatch(
      new RegExp(`^${DEAL_CONTEXT_CACHE_NAMESPACE}[a-f0-9]{64}$`),
    );
  });

  it("expires entries after the configured ttl", async () => {
    vi.useFakeTimers();
    const cache = createDealContextCacheForTests(1);

    await cache.register("token-abc", {
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-11-01",
    });

    vi.advanceTimersByTime(1_100);

    expect(await cache.get("token-abc")).toBeNull();

    vi.useRealTimers();
  });
});
