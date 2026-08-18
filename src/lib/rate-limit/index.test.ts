import { afterEach, describe, expect, it } from "vitest";

import {
  buildRateLimitRedisKey,
  DEAL_RATE_LIMIT,
  SEARCH_RATE_LIMIT,
} from "@/lib/rate-limit/constants";
import {
  assertRateLimitAllowed,
  createRateLimiterForTests,
  resetDefaultRateLimiterForTests,
} from "@/lib/rate-limit";

describe("rate limiting", () => {
  afterEach(() => {
    resetDefaultRateLimiterForTests();
  });

  it("uses namespaced hashed keys for search and deal routes", () => {
    expect(buildRateLimitRedisKey("search", "abc123")).toBe(
      "flightscore:rate:search:abc123",
    );
    expect(buildRateLimitRedisKey("deal", "abc123")).toBe(
      "flightscore:rate:deal:abc123",
    );
  });

  it("allows requests up to the search limit", async () => {
    const limiter = createRateLimiterForTests();

    for (let attempt = 0; attempt < SEARCH_RATE_LIMIT.limit; attempt += 1) {
      await expect(
        assertRateLimitAllowed("search", "client-a", limiter),
      ).resolves.toBe(true);
    }
  });

  it("blocks search requests after the configured limit", async () => {
    const limiter = createRateLimiterForTests();

    for (let attempt = 0; attempt < SEARCH_RATE_LIMIT.limit; attempt += 1) {
      await limiter.check("search", "client-b");
    }

    await expect(
      assertRateLimitAllowed("search", "client-b", limiter),
    ).resolves.toBe(false);
  });

  it("allows requests up to the deal limit", async () => {
    const limiter = createRateLimiterForTests();

    for (let attempt = 0; attempt < DEAL_RATE_LIMIT.limit; attempt += 1) {
      await expect(
        assertRateLimitAllowed("deal", "client-c", limiter),
      ).resolves.toBe(true);
    }
  });

  it("blocks deal requests after the configured limit", async () => {
    const limiter = createRateLimiterForTests();

    for (let attempt = 0; attempt < DEAL_RATE_LIMIT.limit; attempt += 1) {
      await limiter.check("deal", "client-d");
    }

    await expect(
      assertRateLimitAllowed("deal", "client-d", limiter),
    ).resolves.toBe(false);
  });
});
