import { afterEach, describe, expect, it } from "vitest";

import {
  buildSearchCacheKey,
  createSearchCacheForTests,
  ONE_WAY_SENTINEL,
  resetDefaultSearchCacheForTests,
  serializeSearchCacheKey,
} from "@/lib/cache";
import type { SearchRequest } from "@/lib/types/search";

describe("search cache", () => {
  afterEach(() => {
    resetDefaultSearchCacheForTests();
  });

  it("builds a ONE_WAY cache key when returnDate is absent", () => {
    const request: SearchRequest = {
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    };

    expect(buildSearchCacheKey(request)).toEqual({
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      returnDate: ONE_WAY_SENTINEL,
      passengers: 1,
      cabinClass: "ECONOMY",
    });
    expect(serializeSearchCacheKey(buildSearchCacheKey(request))).toBe(
      "LIS|NRT|2026-11-14|ONE_WAY|1|ECONOMY",
    );
  });

  it("stores and returns cached normalized results", () => {
    const cache = createSearchCacheForTests(1800);
    const key = buildSearchCacheKey({
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    });

    expect(cache.get(key)).toBeNull();

    cache.set(key, { currency: "EUR", results: [] });

    expect(cache.get(key)).toEqual({ currency: "EUR", results: [] });
  });

  it("expires entries after the configured TTL", () => {
    const cache = createSearchCacheForTests(1);
    const key = buildSearchCacheKey({
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    });

    cache.set(key, { currency: "EUR", results: [] });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cache.get(key)).toBeNull();
        resolve();
      }, 1100);
    });
  });
});
