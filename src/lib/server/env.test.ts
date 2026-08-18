import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertProductionRedisConfig,
  getUpstashRedisConfig,
  hasRedisConfig,
  shouldUseRedisBackend,
} from "@/lib/server/env";

const originalEnv = { ...process.env };

describe("server env", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VERCEL_ENV;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses in-memory backends when Redis env vars are absent outside production", () => {
    expect(hasRedisConfig()).toBe(false);
    expect(shouldUseRedisBackend()).toBe(false);
    expect(() => assertProductionRedisConfig()).not.toThrow();
  });

  it("requires Redis when VERCEL_ENV is production", () => {
    process.env.VERCEL_ENV = "production";

    expect(() => assertProductionRedisConfig()).toThrow(
      "Upstash Redis is required when VERCEL_ENV=production",
    );
  });

  it("enables Redis backends when REST credentials are present", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-value";

    expect(getUpstashRedisConfig()).toEqual({
      url: "https://example.upstash.io",
      token: "token-value",
    });
    expect(shouldUseRedisBackend()).toBe(true);
  });

  it("allows preview deployments to use in-memory fallback without Redis", () => {
    process.env.VERCEL_ENV = "preview";

    expect(shouldUseRedisBackend()).toBe(false);
    expect(() => assertProductionRedisConfig()).not.toThrow();
  });
});
