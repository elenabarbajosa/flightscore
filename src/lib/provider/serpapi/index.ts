import { ProviderError } from "@/lib/provider/errors";
import type {
  FlightProvider,
  ProviderSearchParams,
  ProviderSearchResult,
} from "@/lib/provider/types";
import { searchGoogleFlights } from "@/lib/provider/serpapi/search";

export class SerpApiFlightProvider implements FlightProvider {
  async search(params: ProviderSearchParams): Promise<ProviderSearchResult> {
    try {
      return await searchGoogleFlights(params);
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      if (
        error instanceof Error &&
        error.message.startsWith("Missing required environment variable")
      ) {
        throw new ProviderError("PROVIDER_CONFIG_ERROR", error.message);
      }

      throw error;
    }
  }
}

export function createSerpApiFlightProvider(): SerpApiFlightProvider {
  return new SerpApiFlightProvider();
}
