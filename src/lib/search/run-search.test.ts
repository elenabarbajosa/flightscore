import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it, vi } from "vitest";

import { buildSearchCacheKey, createSearchCacheForTests } from "@/lib/cache";
import { oneWayFixture } from "@/lib/fixtures/provider-search-results";
import { ProviderError } from "@/lib/provider/errors";
import type { FlightProvider } from "@/lib/provider/types";
import {
  mapProviderErrorToHttpStatus,
  runSearch,
} from "@/lib/search/run-search";
import type { SearchRequest } from "@/lib/types/search";

function futureDate(daysFromToday: number): string {
  return Temporal.Now.plainDateISO("UTC").add({ days: daysFromToday }).toString();
}

const baseRequest: SearchRequest = {
  origin: "LIS",
  destination: "NRT",
  departureDate: futureDate(60),
  passengers: 1,
  cabinClass: "ECONOMY",
};

describe("runSearch", () => {
  it("calls the provider on cache miss and stores normalized results", async () => {
    const provider: FlightProvider = {
      search: vi.fn().mockResolvedValue(oneWayFixture),
    };
    const cache = createSearchCacheForTests(1800);
    let searchIdCount = 0;

    const first = await runSearch(baseRequest, {
      provider,
      cache,
      createSearchId: () => `search-${++searchIdCount}`,
    });

    expect(first.cached).toBe(false);
    expect(first.searchId).toBe("search-1");
    expect(first.results).toHaveLength(1);
    expect(provider.search).toHaveBeenCalledTimes(1);

    const second = await runSearch(baseRequest, {
      provider,
      cache,
      createSearchId: () => `search-${++searchIdCount}`,
    });

    expect(second.cached).toBe(true);
    expect(second.searchId).toBe("search-2");
    expect(second.results).toEqual(first.results);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it("does not call the provider on cache hit", async () => {
    const provider: FlightProvider = {
      search: vi.fn().mockResolvedValue({ currency: "EUR", itineraries: [] }),
    };
    const cache = createSearchCacheForTests(1800);
    const key = buildSearchCacheKey(baseRequest);

    cache.set(key, { currency: "EUR", results: [] });

    const response = await runSearch(baseRequest, { provider, cache });

    expect(response.cached).toBe(true);
    expect(response.results).toEqual([]);
    expect(provider.search).not.toHaveBeenCalled();
  });

  it("uses ONE_WAY in the cache key for one-way searches", async () => {
    const provider: FlightProvider = {
      search: vi.fn().mockResolvedValue({ currency: "EUR", itineraries: [] }),
    };
    const cache = createSearchCacheForTests(1800);

    await runSearch(baseRequest, { provider, cache });

    expect(
      cache.get({
        origin: "LIS",
        destination: "NRT",
        departureDate: baseRequest.departureDate,
        returnDate: "ONE_WAY",
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    ).toEqual({ currency: "EUR", results: [] });
  });
});

describe("mapProviderErrorToHttpStatus", () => {
  it("maps provider quota errors to HTTP 429", () => {
    expect(
      mapProviderErrorToHttpStatus(
        new ProviderError("PROVIDER_QUOTA_EXCEEDED", "quota"),
      ),
    ).toBe(429);
  });

  it("maps provider timeout errors to HTTP 504", () => {
    expect(
      mapProviderErrorToHttpStatus(
        new ProviderError("PROVIDER_TIMEOUT", "timeout"),
      ),
    ).toBe(504);
  });

  it("maps generic provider failures to HTTP 502", () => {
    expect(
      mapProviderErrorToHttpStatus(
        new ProviderError("PROVIDER_REQUEST_FAILED", "failed"),
      ),
    ).toBe(502);
  });

  it("maps provider configuration errors to HTTP 502", () => {
    expect(
      mapProviderErrorToHttpStatus(
        new ProviderError("PROVIDER_CONFIG_ERROR", "config"),
      ),
    ).toBe(502);
  });
});
