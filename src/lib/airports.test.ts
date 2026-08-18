import { describe, expect, it } from "vitest";

import {
  airportAutocompleteCount,
  getMatchTier,
  MATCH_TIER,
  searchAirports,
} from "@/lib/airports";

describe("searchAirports", () => {
  it("indexes all supported airports from the autocomplete dataset", () => {
    expect(airportAutocompleteCount).toBeGreaterThan(8000);
  });

  it("returns no suggestions for an empty query", () => {
    expect(searchAirports("")).toEqual([]);
    expect(searchAirports("   ")).toEqual([]);
  });

  it("returns at most eight suggestions", () => {
    expect(searchAirports("a")).toHaveLength(8);
  });

  it("ranks an exact IATA match ahead of prefix and substring matches", () => {
    const results = searchAirports("LIS");

    expect(results[0]?.iata).toBe("LIS");
    expect(getMatchTier(results[0]!, "LIS", "lis")).toBe(MATCH_TIER.EXACT_IATA);
  });

  it("ranks IATA prefix matches ahead of city and name prefix matches", () => {
    const lisbon = {
      iata: "LIS",
      name: "Humberto Delgado Airport",
      city: "Lisbon",
      countryCode: "PT",
    };
    const cityPrefixOnly = {
      iata: "ZZZ",
      name: "ZZZ Airport",
      city: "Lisbon",
      countryCode: "PT",
    };

    expect(getMatchTier(lisbon, "LI", "li")).toBe(MATCH_TIER.IATA_PREFIX);
    expect(getMatchTier(cityPrefixOnly, "LI", "li")).toBe(MATCH_TIER.CITY_PREFIX);
  });

  it("ranks city prefix matches ahead of airport name prefix matches", () => {
    const cityPrefix = {
      iata: "ZZ1",
      name: "Remote Airfield",
      city: "Paris",
      countryCode: "FR",
    };
    const namePrefix = {
      iata: "ZZ2",
      name: "Paris Orly Airport",
      city: "Elsewhere",
      countryCode: "FR",
    };

    expect(getMatchTier(cityPrefix, "PAR", "par")).toBe(MATCH_TIER.CITY_PREFIX);
    expect(getMatchTier(namePrefix, "PAR", "par")).toBe(MATCH_TIER.NAME_PREFIX);
  });

  it("uses substring matching as the lowest-priority tier", () => {
    const substringMatch = {
      iata: "ZZ3",
      name: "Regional Hub",
      city: "Springfield",
      countryCode: "US",
    };

    expect(getMatchTier(substringMatch, "ING", "ing")).toBe(MATCH_TIER.SUBSTRING);
  });

  it("includes airports beyond the previous curated subset", () => {
    const results = searchAirports("SYD");

    expect(results.some((airport) => airport.iata === "SYD")).toBe(true);
  });
});
