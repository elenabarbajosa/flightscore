import type { CabinClass, SearchRequest } from "@/lib/types/search";

const IATA_PATTERN = /^[A-Z0-9]{3}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const CABIN_CLASSES: readonly CabinClass[] = [
  "ECONOMY",
  "PREMIUM_ECONOMY",
  "BUSINESS",
  "FIRST",
];

export interface SearchFormValues {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: string;
  cabinClass: CabinClass;
}

export type SearchFormField = keyof SearchFormValues;

export type SearchFormErrors = Partial<Record<SearchFormField, string>>;

export function createEmptySearchFormValues(): SearchFormValues {
  return {
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    passengers: "1",
    cabinClass: "ECONOMY",
  };
}

export function normalizeIataInput(value: string): string {
  return value.trim().toUpperCase();
}

export function validateSearchForm(values: SearchFormValues): SearchFormErrors {
  const errors: SearchFormErrors = {};
  const origin = normalizeIataInput(values.origin);
  const destination = normalizeIataInput(values.destination);

  if (!origin) {
    errors.origin = "Enter an origin airport code.";
  } else if (!IATA_PATTERN.test(origin)) {
    errors.origin = "Use a valid 3-character airport code.";
  }

  if (!destination) {
    errors.destination = "Enter a destination airport code.";
  } else if (!IATA_PATTERN.test(destination)) {
    errors.destination = "Use a valid 3-character airport code.";
  }

  if (origin && destination && origin === destination) {
    errors.destination = "Destination must differ from origin.";
  }

  if (!values.departureDate) {
    errors.departureDate = "Choose a departure date.";
  } else if (!ISO_DATE_PATTERN.test(values.departureDate)) {
    errors.departureDate = "Use a valid departure date.";
  } else if (isPastDate(values.departureDate)) {
    errors.departureDate = "Departure date cannot be in the past.";
  }

  if (values.returnDate) {
    if (!ISO_DATE_PATTERN.test(values.returnDate)) {
      errors.returnDate = "Use a valid return date.";
    } else if (
      values.departureDate &&
      values.returnDate < values.departureDate
    ) {
      errors.returnDate = "Return date cannot be before departure.";
    }
  }

  const passengers = Number.parseInt(values.passengers, 10);

  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
    errors.passengers = "Passengers must be between 1 and 9.";
  }

  if (!CABIN_CLASSES.includes(values.cabinClass)) {
    errors.cabinClass = "Choose a valid cabin class.";
  }

  return errors;
}

export function buildSearchRequest(values: SearchFormValues): SearchRequest {
  const request: SearchRequest = {
    origin: normalizeIataInput(values.origin),
    destination: normalizeIataInput(values.destination),
    departureDate: values.departureDate,
    passengers: Number.parseInt(values.passengers, 10),
    cabinClass: values.cabinClass,
  };

  if (values.returnDate.trim()) {
    request.returnDate = values.returnDate.trim();
  }

  return request;
}

function isPastDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(`${value}T00:00:00`);

  return candidate < today;
}

export function hasSearchFormErrors(errors: SearchFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
