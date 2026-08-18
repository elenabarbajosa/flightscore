import type { FlightProvider } from "@/lib/provider/types";
import { createSerpApiFlightProvider } from "@/lib/provider/serpapi";

export type {
  FlightProvider,
  ProviderItinerary,
  ProviderJourney,
  ProviderLayoverHint,
  ProviderSearchParams,
  ProviderSearchResult,
  ProviderSegment,
} from "@/lib/provider/types";

export { ProviderError } from "@/lib/provider/errors";
export type { ProviderErrorCode } from "@/lib/provider/errors";

export function getFlightProvider(): FlightProvider {
  return createSerpApiFlightProvider();
}
