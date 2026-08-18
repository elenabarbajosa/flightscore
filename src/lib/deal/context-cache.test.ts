import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDealContextCacheForTests,
  resetDefaultDealContextCacheForTests,
} from "@/lib/deal/context-cache";

describe("deal context cache", () => {
  afterEach(() => {
    resetDefaultDealContextCacheForTests();
  });

  it("registers search context keyed by hashed dealReference", () => {
    const cache = createDealContextCacheForTests(300);

    cache.register("token-abc", {
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-11-01",
    });

    expect(cache.get("token-abc")).toEqual({
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-11-01",
    });
  });

  it("expires entries after the configured ttl", () => {
    vi.useFakeTimers();
    const cache = createDealContextCacheForTests(1);

    cache.register("token-abc", {
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-11-01",
    });

    vi.advanceTimersByTime(1_100);

    expect(cache.get("token-abc")).toBeNull();

    vi.useRealTimers();
  });
});
