import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildSearchCacheKey,
  buildSearchCacheRedisKey,
  getSearchCache,
  resetDefaultSearchCacheForTests,
} from "@/lib/cache";
import {
  resetCacheBackendForTests,
  setRedisJsonStoreForTests,
} from "@/lib/cache/backend";
import type { RedisJsonStore } from "@/lib/cache/redis-json-store";
import { getCacheTtlSeconds } from "@/lib/server/env";

vi.mock("@/lib/server/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/env")>();

  return {
    ...actual,
    shouldUseRedisBackend: vi.fn(() => true),
    getCacheTtlSeconds: vi.fn(() => 1800),
    assertProductionRedisConfig: vi.fn(),
    getUpstashRedisConfig: vi.fn(() => ({
      url: "https://example.upstash.io",
      token: "token-value",
    })),
  };
});

describe("redis cache backend selection", () => {
  afterEach(() => {
    resetDefaultSearchCacheForTests();
    resetCacheBackendForTests();
    setRedisJsonStoreForTests(null);
    vi.clearAllMocks();
  });

  it("stores search cache payloads in namespaced Redis keys with TTL", async () => {
    const store: RedisJsonStore = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      increment: vi.fn(),
    };

    setRedisJsonStoreForTests(store);
    resetDefaultSearchCacheForTests();

    const cache = getSearchCache();
    const key = buildSearchCacheKey({
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    });
    const payload = { currency: "EUR" as const, results: [] };

    await cache.set(key, payload);

    expect(store.set).toHaveBeenCalledWith(
      buildSearchCacheRedisKey(key),
      payload,
      getCacheTtlSeconds(),
    );
  });
});
