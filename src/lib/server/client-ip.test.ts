import { describe, expect, it } from "vitest";

import {
  extractClientIp,
  getRateLimitIdentifier,
  hashRateLimitIdentifier,
  LOCAL_DEV_CLIENT_IDENTIFIER,
} from "@/lib/server/client-ip";

describe("client IP extraction", () => {
  it("uses the first valid IP from x-forwarded-for", () => {
    const request = new Request("http://localhost/api/search", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 70.41.3.18",
      },
    });

    expect(extractClientIp(request)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip when forwarded-for is absent", () => {
    const request = new Request("http://localhost/api/search", {
      headers: {
        "x-real-ip": "198.51.100.4",
      },
    });

    expect(extractClientIp(request)).toBe("198.51.100.4");
  });

  it("uses a deterministic local identifier when no trusted headers exist", () => {
    const request = new Request("http://localhost/api/search");

    expect(extractClientIp(request)).toBe(LOCAL_DEV_CLIENT_IDENTIFIER);
  });

  it("hashes identifiers before rate-limit storage", () => {
    const request = new Request("http://localhost/api/search", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    });

    const identifier = getRateLimitIdentifier(request);

    expect(identifier).toBe(hashRateLimitIdentifier("203.0.113.10"));
    expect(identifier).not.toContain("203.0.113.10");
  });
});
