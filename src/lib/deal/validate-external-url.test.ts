import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertGoogleBookingRequestUrl,
  assertSafeExternalHttpsUrl,
} from "@/lib/deal/validate-external-url";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async (hostname: string) => {
    if (hostname === "blocked.example") {
      return [{ address: "10.0.0.12", family: 4 }];
    }

    if (hostname === "airline.example") {
      return [{ address: "93.184.216.34", family: 4 }];
    }

    return [{ address: "93.184.216.34", family: 4 }];
  }),
}));

describe("assertSafeExternalHttpsUrl", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a public HTTPS URL", async () => {
    await expect(
      assertSafeExternalHttpsUrl("https://airline.example/book"),
    ).resolves.toBeInstanceOf(URL);
  });

  it("rejects HTTP URLs", async () => {
    await expect(assertSafeExternalHttpsUrl("http://airline.example/book")).rejects.toThrow(
      "Only HTTPS destinations are allowed.",
    );
  });

  it("rejects javascript URLs", async () => {
    await expect(
      assertSafeExternalHttpsUrl("javascript:alert(1)"),
    ).rejects.toThrow("Only HTTPS destinations are allowed.");
  });

  it("rejects localhost", async () => {
    await expect(
      assertSafeExternalHttpsUrl("https://localhost/book"),
    ).rejects.toThrow("URL hostname is not allowed.");
  });

  it("rejects private IP literals", async () => {
    await expect(
      assertSafeExternalHttpsUrl("https://127.0.0.1/book"),
    ).rejects.toThrow("URL IP address is not allowed.");
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    await expect(
      assertSafeExternalHttpsUrl("https://blocked.example/book"),
    ).rejects.toThrow("URL resolves to a blocked address.");
  });
});

describe("assertGoogleBookingRequestUrl", () => {
  it("accepts the expected Google booking-request URL", async () => {
    await expect(
      assertGoogleBookingRequestUrl("https://www.google.com/travel/clk/f"),
    ).resolves.toBeInstanceOf(URL);
  });

  it("rejects unexpected booking-request hosts before fetch", async () => {
    await expect(
      assertGoogleBookingRequestUrl("https://evil.example/travel/clk/f"),
    ).rejects.toThrow("Booking request host is not allowed.");
  });
});
