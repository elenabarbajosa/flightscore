import type { CabinClass } from "@/lib/types/search";
import {
  REQUESTED_CURRENCY,
  REQUESTED_LANGUAGE,
} from "@/lib/provider/constants";
import type { ProviderSearchParams } from "@/lib/provider/types";
import type { SerpApiQueryParams } from "@/lib/provider/serpapi/types";

const TRAVEL_CLASS_BY_CABIN: Record<CabinClass, string> = {
  ECONOMY: "1",
  PREMIUM_ECONOMY: "2",
  BUSINESS: "3",
  FIRST: "4",
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSerpApiEngine(): string {
  return readRequiredEnv("SERPAPI_ENGINE");
}

export function getSerpApiApiKey(): string {
  return readRequiredEnv("SERPAPI_API_KEY");
}

export function buildBaseQueryParams(
  params: ProviderSearchParams,
): SerpApiQueryParams {
  return {
    engine: getSerpApiEngine(),
    api_key: getSerpApiApiKey(),
    output: "json",
    departure_id: params.origin.trim().toUpperCase(),
    arrival_id: params.destination.trim().toUpperCase(),
    outbound_date: params.departureDate,
    currency: REQUESTED_CURRENCY,
    hl: REQUESTED_LANGUAGE,
    adults: String(params.passengers),
    travel_class: TRAVEL_CLASS_BY_CABIN[params.cabinClass],
    stops: "3",
  };
}

export function buildOneWayQueryParams(
  params: ProviderSearchParams,
): SerpApiQueryParams {
  return {
    ...buildBaseQueryParams(params),
    type: "2",
  };
}

export function buildRoundTripOutboundQueryParams(
  params: ProviderSearchParams,
): SerpApiQueryParams {
  if (!params.returnDate) {
    throw new Error("returnDate is required for round-trip searches");
  }

  return {
    ...buildBaseQueryParams(params),
    type: "1",
    return_date: params.returnDate,
  };
}

export function buildRoundTripReturnQueryParams(
  params: ProviderSearchParams,
  departureToken: string,
): SerpApiQueryParams {
  return {
    ...buildRoundTripOutboundQueryParams(params),
    departure_token: departureToken,
  };
}
