import { afterEach, describe, expect, it, vi } from "vitest";

import { searchFlights, SearchApiError } from "@/lib/client/search-api";
import { getSearchErrorMessage } from "@/lib/client/search-errors";
import type { SearchRequest } from "@/lib/types/search";

describe("search API wrapper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns normalized search responses on success", async () => {
    const request: SearchRequest = {
      origin: "LIS",
      destination: "NRT",
      departureDate: "2026-11-14",
      passengers: 1,
      cabinClass: "ECONOMY",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          currency: "EUR",
          searchId: "search_123",
          cached: false,
          results: [],
        }),
      }),
    );

    const response = await searchFlights(request);

    expect(response.cached).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  });

  it("throws SearchApiError with safe user-facing copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "PROVIDER_ERROR",
        }),
      }),
    );

    await expect(
      searchFlights({
        origin: "LIS",
        destination: "NRT",
        departureDate: "2026-11-14",
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    ).rejects.toMatchObject({
      name: "SearchApiError",
      code: "PROVIDER_ERROR",
      message: getSearchErrorMessage({ error: "PROVIDER_ERROR" }),
    });

    try {
      await searchFlights({
        origin: "LIS",
        destination: "NRT",
        departureDate: "2026-11-14",
        passengers: 1,
        cabinClass: "ECONOMY",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SearchApiError);
      expect((error as SearchApiError).message).not.toContain("SerpApi");
    }
  });
});

describe("search error messages", () => {
  it("maps API error codes to safe user-facing copy", () => {
    expect(getSearchErrorMessage({ error: "INVALID_INPUT" })).toBe(
      "Please check your search details and try again.",
    );
    expect(
      getSearchErrorMessage({ error: "INVALID_INPUT", field: "returnDate" }),
    ).toBe(
      "Please check your search details and try again. (return date)",
    );
    expect(getSearchErrorMessage({ error: "QUOTA_EXCEEDED" })).toBe(
      "Search limit reached. Please wait a few minutes and try again.",
    );
  });
});
