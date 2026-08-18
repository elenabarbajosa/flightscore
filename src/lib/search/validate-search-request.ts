import { Temporal } from "@js-temporal/polyfill";

import { getAirportByIata } from "@/lib/airport-metadata";
import { SearchValidationError } from "@/lib/search/errors";
import type { CabinClass, SearchRequest } from "@/lib/types/search";

const IATA_CODE_PATTERN = /^[A-Z0-9]{3}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const CABIN_CLASSES: readonly CabinClass[] = [
  "ECONOMY",
  "PREMIUM_ECONOMY",
  "BUSINESS",
  "FIRST",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseIsoDate(value: string, field: string): Temporal.PlainDate {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new SearchValidationError("Invalid date format", field);
  }

  try {
    return Temporal.PlainDate.from(value);
  } catch {
    throw new SearchValidationError("Invalid date value", field);
  }
}

function getTodayUtc(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO("UTC");
}

function normalizeIataCode(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new SearchValidationError("Invalid airport code", field);
  }

  const normalized = value.trim().toUpperCase();

  if (!IATA_CODE_PATTERN.test(normalized)) {
    throw new SearchValidationError("Invalid airport code format", field);
  }

  if (!getAirportByIata(normalized)) {
    throw new SearchValidationError("Unknown airport code", field);
  }

  return normalized;
}

function normalizeOptionalReturnDate(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new SearchValidationError("Invalid return date", "returnDate");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return parseIsoDate(trimmed, "returnDate").toString();
}

function normalizePassengers(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new SearchValidationError("Invalid passenger count", "passengers");
  }

  if (value < 1 || value > 9) {
    throw new SearchValidationError("Passenger count must be between 1 and 9", "passengers");
  }

  return value;
}

function normalizeCabinClass(value: unknown): CabinClass {
  if (typeof value !== "string" || !CABIN_CLASSES.includes(value as CabinClass)) {
    throw new SearchValidationError("Invalid cabin class", "cabinClass");
  }

  return value as CabinClass;
}

export function validateSearchRequest(body: unknown): SearchRequest {
  if (!isPlainObject(body)) {
    throw new SearchValidationError("Invalid request body");
  }

  const origin = normalizeIataCode(body.origin, "origin");
  const destination = normalizeIataCode(body.destination, "destination");

  if (origin === destination) {
    throw new SearchValidationError(
      "Origin and destination must differ",
      "destination",
    );
  }

  const departureDate = parseIsoDate(
    typeof body.departureDate === "string" ? body.departureDate.trim() : "",
    "departureDate",
  ).toString();

  if (Temporal.PlainDate.compare(departureDate, getTodayUtc()) < 0) {
    throw new SearchValidationError("Departure date cannot be in the past", "departureDate");
  }

  const returnDate = normalizeOptionalReturnDate(body.returnDate);

  if (returnDate && Temporal.PlainDate.compare(returnDate, departureDate) < 0) {
    throw new SearchValidationError(
      "Return date cannot be before departure date",
      "returnDate",
    );
  }

  return {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers: normalizePassengers(body.passengers),
    cabinClass: normalizeCabinClass(body.cabinClass),
  };
}
