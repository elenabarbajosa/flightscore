import { describe, expect, it } from "vitest";

import {
  selectBookingOption,
  getEffectiveEurPrice,
} from "@/lib/deal/select-booking-option";
import type { ProviderBookingOption } from "@/lib/provider/types";

function createOption(
  overrides: Partial<ProviderBookingOption> &
    Pick<ProviderBookingOption, "sellerName">,
): ProviderBookingOption {
  return {
    isAirlineDirect: false,
    priceEur: 100,
    isSeparateTickets: false,
    bookingRequest: {
      method: "POST",
      url: "https://www.google.com/travel/clk/f",
      postBody: "u=test",
    },
    ...overrides,
  };
}

describe("selectBookingOption", () => {
  it("selects the cheapest EUR seller", () => {
    const selected = selectBookingOption([
      createOption({
        sellerName: "British Airways",
        isAirlineDirect: true,
        priceEur: 173,
      }),
      createOption({
        sellerName: "BudgetAir",
        isAirlineDirect: false,
        priceEur: 155,
      }),
    ]);

    expect(selected.sellerName).toBe("BudgetAir");
  });

  it("prefers airline-direct only when effective EUR price is tied", () => {
    const selected = selectBookingOption([
      createOption({
        sellerName: "Alpha Travel",
        isAirlineDirect: false,
        priceEur: 150,
      }),
      createOption({
        sellerName: "Zeta Air",
        isAirlineDirect: true,
        priceEur: 150,
      }),
    ]);

    expect(selected.sellerName).toBe("Zeta Air");
  });

  it("uses seller name as the final stable tie-breaker", () => {
    const selected = selectBookingOption([
      createOption({
        sellerName: "Zulu Travel",
        isAirlineDirect: false,
        priceEur: 150,
      }),
      createOption({
        sellerName: "Alpha Travel",
        isAirlineDirect: false,
        priceEur: 150,
      }),
    ]);

    expect(selected.sellerName).toBe("Alpha Travel");
  });

  it("ignores options without booking requests", () => {
    const selected = selectBookingOption([
      createOption({
        sellerName: "Phone Seller",
        bookingRequest: null,
      }),
      createOption({
        sellerName: "BudgetAir",
        priceEur: 200,
      }),
    ]);

    expect(selected.sellerName).toBe("BudgetAir");
  });
});

describe("getEffectiveEurPrice", () => {
  it("returns the mapped EUR price", () => {
    expect(
      getEffectiveEurPrice(
        createOption({ sellerName: "Example", priceEur: 123.45 }),
      ),
    ).toBe(123.45);
  });
});
