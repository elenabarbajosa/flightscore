import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertProductionRedisConfig,
  getUpstashRedisConfig,
  hasRedisConfig,
  shouldUseRedisBackend,
} from "@/lib/server/env";

const originalEnv = { ...process.env };

function clearRedisEnv(): void {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

describe("server env", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VERCEL_ENV;
    clearRedisEnv();
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

  it("enables Redis backends when Vercel KV REST credentials are present", () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "token-value";

    expect(getUpstashRedisConfig()).toEqual({
      url: "https://example.upstash.io",
      token: "token-value",
    });
    expect(shouldUseRedisBackend()).toBe(true);
  });

  it("supports legacy UPSTASH_REDIS_* credentials", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://legacy.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "legacy-token";

    expect(getUpstashRedisConfig()).toEqual({
      url: "https://legacy.upstash.io",
      token: "legacy-token",
    });
  });

  it("prefers KV_REST_API_* when both naming schemes are present", () => {
    process.env.KV_REST_API_URL = "https://kv.upstash.io";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.UPSTASH_REDIS_REST_URL = "https://legacy.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "legacy-token";

    expect(getUpstashRedisConfig()).toEqual({
      url: "https://kv.upstash.io",
      token: "kv-token",
    });
  });

  it("fails safely when Redis credentials are incomplete", () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";

    expect(() => getUpstashRedisConfig()).toThrow(
      "Redis REST credentials are incomplete",
    );
  });

  it("allows preview deployments to use in-memory fallback without Redis", () => {
    process.env.VERCEL_ENV = "preview";

    expect(shouldUseRedisBackend()).toBe(false);
    expect(() => assertProductionRedisConfig()).not.toThrow();
  });
});
