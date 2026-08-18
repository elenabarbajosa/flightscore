import { describe, expect, it, vi } from "vitest";

import { buildBookingOptionsQueryParams } from "@/lib/provider/serpapi/booking-params";

vi.mock("@/lib/provider/serpapi/params", () => ({
  getSerpApiEngine: () => "google_flights",
  getSerpApiApiKey: () => "test-key",
}));

describe("buildBookingOptionsQueryParams", () => {
  it("includes route context required by SerpApi booking lookups", () => {
    expect(
      buildBookingOptionsQueryParams("booking-token", {
        origin: "LIS",
        destination: "CDG",
        departureDate: "2026-12-20",
      }),
    ).toEqual({
      engine: "google_flights",
      api_key: "test-key",
      output: "json",
      departure_id: "LIS",
      arrival_id: "CDG",
      outbound_date: "2026-12-20",
      booking_token: "booking-token",
      currency: "EUR",
      hl: "en",
      type: "2",
    });
  });

  it("includes return_date and round-trip type when provided", () => {
    const params = buildBookingOptionsQueryParams("booking-token", {
      origin: "LIS",
      destination: "CDG",
      departureDate: "2026-12-20",
      returnDate: "2026-12-27",
    });

    expect(params.type).toBe("1");
    expect(params.return_date).toBe("2026-12-27");
  });
});
