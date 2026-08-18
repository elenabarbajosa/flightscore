import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDealCacheForTests,
  resetDefaultDealCacheForTests,
} from "@/lib/deal/cache";
import {
  createDealContextCacheForTests,
  resetDefaultDealContextCacheForTests,
} from "@/lib/deal/context-cache";
import { DealResolutionError } from "@/lib/deal/errors";
import { runDealResolution } from "@/lib/deal/run-deal-resolution";
import { ProviderError } from "@/lib/provider/errors";
import type { FlightProvider } from "@/lib/provider/types";

const DEAL_REFERENCE = "token-123";
const SEARCH_CONTEXT = {
  origin: "LIS",
  destination: "CDG",
  departureDate: "2026-11-01",
};

describe("runDealResolution", () => {
  afterEach(() => {
    resetDefaultDealCacheForTests();
    resetDefaultDealContextCacheForTests();
  });

  it("resolves a deal through the provider and caches the safe destination", async () => {
    const contextCache = createDealContextCacheForTests(300);
    contextCache.register(DEAL_REFERENCE, SEARCH_CONTEXT);

    const resolveDeal = vi.fn().mockResolvedValue({
      options: [
        {
          sellerName: "BudgetAir",
          isAirlineDirect: false,
          priceEur: 155,
          isSeparateTickets: false,
          bookingRequest: {
            method: "POST",
            url: "https://www.google.com/travel/clk/f",
            postBody: "u=test",
          },
        },
      ],
    });
    const resolveBookingDestination = vi.fn().mockResolvedValue({
      redirectUrl: "https://airline.example/book",
      sellerName: "BudgetAir",
    });

    const provider: FlightProvider = {
      search: vi.fn(),
      resolveDeal,
      resolveBookingDestination,
    };
    const cache = createDealCacheForTests(300);

    const first = await runDealResolution(
      { dealReference: DEAL_REFERENCE },
      { provider, cache, contextCache },
    );

    expect(first).toEqual({
      redirectUrl: "https://airline.example/book",
      sellerName: "BudgetAir",
    });

    const second = await runDealResolution(
      { dealReference: DEAL_REFERENCE },
      { provider, cache, contextCache },
    );

    expect(second).toEqual(first);
    expect(resolveDeal).toHaveBeenCalledTimes(1);
    expect(resolveDeal).toHaveBeenCalledWith({
      dealReference: DEAL_REFERENCE,
      searchContext: SEARCH_CONTEXT,
    });
    expect(resolveBookingDestination).toHaveBeenCalledTimes(1);
  });

  it("maps separate-ticket-only provider results to DEAL_UNAVAILABLE", async () => {
    const contextCache = createDealContextCacheForTests(300);
    contextCache.register("token-separate", SEARCH_CONTEXT);

    const provider: FlightProvider = {
      search: vi.fn(),
      resolveDeal: vi.fn().mockRejectedValue(
        new ProviderError(
          "PROVIDER_NO_BOOKING_OPTIONS",
          "Separate ticket booking options only",
        ),
      ),
      resolveBookingDestination: vi.fn(),
    };

    await expect(
      runDealResolution(
        { dealReference: "token-separate" },
        { provider, contextCache },
      ),
    ).rejects.toMatchObject({
      code: "DEAL_UNAVAILABLE",
    });
  });

  it("maps expired provider tokens to DEAL_EXPIRED", async () => {
    const contextCache = createDealContextCacheForTests(300);
    contextCache.register("token-expired", SEARCH_CONTEXT);

    const provider: FlightProvider = {
      search: vi.fn(),
      resolveDeal: vi.fn().mockRejectedValue(
        new ProviderError("PROVIDER_DEAL_EXPIRED", "expired"),
      ),
      resolveBookingDestination: vi.fn(),
    };

    await expect(
      runDealResolution(
        { dealReference: "token-expired" },
        { provider, contextCache },
      ),
    ).rejects.toBeInstanceOf(DealResolutionError);
  });

  it("returns DEAL_UNAVAILABLE when search context cannot be resolved", async () => {
    const provider: FlightProvider = {
      search: vi.fn(),
      resolveDeal: vi.fn(),
      resolveBookingDestination: vi.fn(),
    };

    await expect(
      runDealResolution({ dealReference: "unknown-token" }, { provider }),
    ).rejects.toMatchObject({
      code: "DEAL_UNAVAILABLE",
    });
  });
});
