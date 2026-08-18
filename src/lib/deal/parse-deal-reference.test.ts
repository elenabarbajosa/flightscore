import { describe, expect, it } from "vitest";

import {
  parseDealReferenceContext,
  resolveDealSearchContext,
} from "@/lib/deal/parse-deal-reference";
import { createDealContextCacheForTests } from "@/lib/deal/context-cache";

const ONE_WAY_CONNECTING_TOKEN = Buffer.from(
  JSON.stringify([
    "inner-token",
    [
      ["LIS", "2026-12-20", "AMS", null, "KL", "1580"],
      ["AMS", "2026-12-20", "CDG", null, "KL", "1411"],
    ],
  ]),
).toString("base64");

describe("parseDealReferenceContext", () => {
  it("derives one-way search context from a booking token payload", () => {
    expect(parseDealReferenceContext(ONE_WAY_CONNECTING_TOKEN)).toEqual({
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-12-20",
    });
  });

  it("derives round-trip context when return segments are embedded", () => {
    const token = Buffer.from(
      JSON.stringify([
        "inner-token",
        [
          ["LIS", "2026-12-20", "CDG", null, "AF", "1125"],
          ["CDG", "2026-12-27", "LIS", null, "AF", "1126"],
        ],
      ]),
    ).toString("base64");

    expect(parseDealReferenceContext(token)).toEqual({
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-12-20",
      returnDate: "2026-12-27",
    });
  });
});

describe("resolveDealSearchContext", () => {
  it("prefers registered search context over token parsing", async () => {
    const cache = createDealContextCacheForTests(300);

    await cache.register(ONE_WAY_CONNECTING_TOKEN, {
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-12-20",
      returnDate: "2026-12-27",
    });

    await expect(
      resolveDealSearchContext(ONE_WAY_CONNECTING_TOKEN, cache),
    ).resolves.toEqual({
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-12-20",
      returnDate: "2026-12-27",
    });
  });
});
