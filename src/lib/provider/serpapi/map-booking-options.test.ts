import { describe, expect, it } from "vitest";

import {
  separateTicketsOnlyEntry,
  togetherAirlineOption,
  togetherOtaOption,
} from "@/lib/fixtures/provider-booking-options";
import { mapSerpApiBookingOptions } from "@/lib/provider/serpapi/map-booking-options";

describe("mapSerpApiBookingOptions", () => {
  it("maps together booking options and EUR prices", () => {
    const options = mapSerpApiBookingOptions([
      togetherAirlineOption,
      togetherOtaOption,
    ]);

    expect(options).toHaveLength(2);
    expect(options[0]?.sellerName).toBe("British Airways");
    expect(options[0]?.priceEur).toBe(173);
    expect(options[0]?.bookingRequest?.method).toBe("POST");
  });

  it("excludes separate-ticket-only booking groups", () => {
    const options = mapSerpApiBookingOptions([separateTicketsOnlyEntry]);

    expect(options).toHaveLength(0);
  });

  it("supports GET booking requests when post_data is absent", () => {
    const options = mapSerpApiBookingOptions([
      {
        together: {
          book_with: "Example Air",
          airline: true,
          price: 120,
          booking_request: {
            url: "https://www.google.com/travel/clk/f",
          },
        },
      },
    ]);

    expect(options[0]?.bookingRequest).toEqual({
      method: "GET",
      url: "https://www.google.com/travel/clk/f",
    });
  });
});
