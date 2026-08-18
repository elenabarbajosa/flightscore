import { describe, expect, it } from "vitest";

import {
  buildSearchRequest,
  createEmptySearchFormValues,
  hasSearchFormErrors,
  normalizeIataInput,
  validateSearchForm,
} from "@/lib/client/search-form-validation";

describe("search form validation", () => {
  it("uppercases typed IATA values", () => {
    expect(normalizeIataInput(" lis ")).toBe("LIS");
  });

  it("accepts any valid 3-character IATA code without curated-list checks", () => {
    const values = {
      ...createEmptySearchFormValues(),
      origin: "AAA",
      destination: "ZZZ",
      departureDate: "2099-01-01",
    };

    expect(hasSearchFormErrors(validateSearchForm(values))).toBe(false);
    expect(buildSearchRequest(values)).toEqual({
      origin: "AAA",
      destination: "ZZZ",
      departureDate: "2099-01-01",
      passengers: 1,
      cabinClass: "ECONOMY",
    });
  });

  it("rejects invalid IATA codes and matching origin/destination", () => {
    const invalidCode = validateSearchForm({
      ...createEmptySearchFormValues(),
      origin: "12",
      destination: "LIS",
      departureDate: "2099-01-01",
    });

    expect(invalidCode.origin).toBe("Use a valid 3-character airport code.");

    const sameAirport = validateSearchForm({
      ...createEmptySearchFormValues(),
      origin: "LIS",
      destination: "LIS",
      departureDate: "2099-01-01",
    });

    expect(sameAirport.destination).toBe(
      "Destination must differ from origin.",
    );
  });

  it("validates return date ordering", () => {
    const errors = validateSearchForm({
      ...createEmptySearchFormValues(),
      origin: "LIS",
      destination: "NRT",
      departureDate: "2099-02-01",
      returnDate: "2099-01-01",
    });

    expect(errors.returnDate).toBe("Return date cannot be before departure.");
  });
});
