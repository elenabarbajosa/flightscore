import {
  getDealContextCache,
  type DealContextCache,
  type DealSearchContext,
} from "@/lib/deal/context-cache";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IATA_CODE_PATTERN = /^[A-Z0-9]{3}$/;

type BookingTokenSegment = [
  string,
  string,
  string,
  unknown,
  string,
  string,
];

function isBookingTokenSegment(value: unknown): value is BookingTokenSegment {
  return (
    Array.isArray(value) &&
    value.length >= 6 &&
    typeof value[0] === "string" &&
    typeof value[1] === "string" &&
    typeof value[2] === "string" &&
    typeof value[4] === "string" &&
    typeof value[5] === "string"
  );
}

function isConnectedItinerary(segments: BookingTokenSegment[]): boolean {
  for (let index = 0; index < segments.length - 1; index += 1) {
    if (segments[index][2] !== segments[index + 1][0]) {
      return false;
    }
  }

  return true;
}

function validateAirportCode(value: string): boolean {
  return IATA_CODE_PATTERN.test(value);
}

function validateDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value);
}

export function parseDealReferenceContext(
  dealReference: string,
): DealSearchContext | null {
  try {
    const decoded = Buffer.from(dealReference, "base64").toString("utf8");
    const payload = JSON.parse(decoded) as unknown;

    if (!Array.isArray(payload) || payload.length < 2) {
      return null;
    }

    const segments = payload[1];

    if (!Array.isArray(segments) || segments.length === 0) {
      return null;
    }

    if (!segments.every(isBookingTokenSegment)) {
      return null;
    }

    if (!isConnectedItinerary(segments)) {
      return null;
    }

    const origin = segments[0][0].trim().toUpperCase();
    const departureDate = segments[0][1].trim();
    const destination = segments[segments.length - 1][2].trim().toUpperCase();

    if (
      !validateAirportCode(origin) ||
      !validateAirportCode(destination) ||
      !validateDate(departureDate)
    ) {
      return null;
    }

    const returnsToOrigin =
      segments.length > 1 &&
      segments[segments.length - 1][2].trim().toUpperCase() === origin;

    if (returnsToOrigin) {
      let turnaroundIndex = -1;

      for (let index = 0; index < segments.length - 1; index += 1) {
        const airport = segments[index][2].trim().toUpperCase();

        if (airport !== origin && segments[index + 1][0].trim().toUpperCase() === airport) {
          turnaroundIndex = index;
          break;
        }
      }

      if (turnaroundIndex === -1) {
        return null;
      }

      const turnaroundAirport = segments[turnaroundIndex][2].trim().toUpperCase();
      const returnDate = segments[turnaroundIndex + 1][1].trim();

      if (!validateAirportCode(turnaroundAirport) || !validateDate(returnDate)) {
        return null;
      }

      return {
        origin,
        destination: turnaroundAirport,
        departureDate,
        returnDate,
      };
    }

    return {
      origin,
      destination,
      departureDate,
    };
  } catch {
    return null;
  }
}

export async function resolveDealSearchContext(
  dealReference: string,
  cache: DealContextCache = getDealContextCache(),
): Promise<DealSearchContext | null> {
  return (await cache.get(dealReference)) ?? parseDealReferenceContext(dealReference);
}
