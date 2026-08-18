import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { validateSearchRequest } from "@/lib/search/validate-search-request";

function futureDate(daysFromToday: number): string {
  return Temporal.Now.plainDateISO("UTC").add({ days: daysFromToday }).toString();
}

describe("validateSearchRequest", () => {
  it("accepts a valid one-way request", () => {
    const result = validateSearchRequest({
      origin: "lis",
      destination: "nrt",
      departureDate: futureDate(60),
      passengers: 1,
      cabinClass: "ECONOMY",
    });

    expect(result).toEqual({
      origin: "LIS",
      destination: "NRT",
      departureDate: futureDate(60),
      passengers: 1,
      cabinClass: "ECONOMY",
    });
    expect(result.returnDate).toBeUndefined();
  });

  it("accepts a valid round-trip request", () => {
    const departureDate = futureDate(60);
    const returnDate = futureDate(74);

    const result = validateSearchRequest({
      origin: "LIS",
      destination: "NRT",
      departureDate,
      returnDate,
      passengers: 2,
      cabinClass: "BUSINESS",
    });

    expect(result.returnDate).toBe(returnDate);
  });

  it("rejects a missing required field", () => {
    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        cabinClass: "ECONOMY",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "passengers",
      }),
    );
  });

  it("rejects an invalid passenger count", () => {
    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        passengers: 10,
        cabinClass: "ECONOMY",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "passengers",
      }),
    );
  });

  it("rejects an invalid cabin class", () => {
    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "SUPER_FIRST",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "cabinClass",
      }),
    );
  });

  it("rejects a past departure date", () => {
    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: "2020-01-01",
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "departureDate",
      }),
    );
  });

  it("rejects a return date before departure", () => {
    const departureDate = futureDate(30);

    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate,
        returnDate: futureDate(20),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "returnDate",
      }),
    );
  });

  it("allows same-day return", () => {
    const departureDate = futureDate(30);

    expect(
      validateSearchRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate,
        returnDate: departureDate,
        passengers: 1,
        cabinClass: "ECONOMY",
      }).returnDate,
    ).toBe(departureDate);
  });

  it("rejects unknown airport codes using comprehensive metadata", () => {
    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "ZZZ",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "destination",
      }),
    );
  });

  it("rejects when origin equals destination", () => {
    expect(() =>
      validateSearchRequest({
        origin: "LIS",
        destination: "LIS",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    ).toThrowError(
      expect.objectContaining({
        field: "destination",
      }),
    );
  });

  it("rejects malformed request bodies", () => {
    expect(() => validateSearchRequest(null)).toThrowError(
      expect.objectContaining({
        name: "SearchValidationError",
      }),
    );
  });
});
