import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDealCacheForTests,
  resetDefaultDealCacheForTests,
} from "@/lib/deal/cache";

describe("deal cache", () => {
  afterEach(() => {
    resetDefaultDealCacheForTests();
  });

  it("stores successful resolutions keyed by hashed dealReference", () => {
    const cache = createDealCacheForTests(300);

    cache.set("raw-token-value", {
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });

    expect(cache.get("raw-token-value")).toEqual({
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });
  });

  it("expires cached resolutions after the configured TTL", () => {
    vi.useFakeTimers();
    const cache = createDealCacheForTests(1);

    cache.set("raw-token-value", {
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });

    vi.advanceTimersByTime(1100);

    expect(cache.get("raw-token-value")).toBeNull();
    vi.useRealTimers();
  });
});
