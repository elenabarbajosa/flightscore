import { registerDealSearchContexts } from "@/lib/deal/context-cache";
import {
  buildSearchCacheKey,
  getSearchCache,
  type SearchCache,
} from "@/lib/cache";
import { normalizeProviderSearchResult } from "@/lib/normalize";
import { getFlightProvider } from "@/lib/provider";
import { ProviderError } from "@/lib/provider/errors";
import type { FlightProvider } from "@/lib/provider/types";
import type { SearchRequest, SearchResponse } from "@/lib/types/search";
import { randomUUID } from "node:crypto";

export interface RunSearchDependencies {
  provider?: FlightProvider;
  cache?: SearchCache;
  createSearchId?: () => string;
}

export async function runSearch(
  request: SearchRequest,
  dependencies: RunSearchDependencies = {},
): Promise<SearchResponse> {
  const provider = dependencies.provider ?? getFlightProvider();
  const cache = dependencies.cache ?? getSearchCache();
  const createSearchId = dependencies.createSearchId ?? randomUUID;
  const cacheKey = buildSearchCacheKey(request);
  const cachedPayload = await cache.get(cacheKey);

  if (cachedPayload) {
    await registerDealSearchContexts(cachedPayload.results, {
      origin: request.origin,
      destination: request.destination,
      departureDate: request.departureDate,
      returnDate: request.returnDate,
    });

    return {
      currency: "EUR",
      searchId: createSearchId(),
      cached: true,
      results: cachedPayload.results,
    };
  }

  const providerResult = await provider.search(request);
  const normalized = normalizeProviderSearchResult(providerResult);

  await cache.set(cacheKey, {
    currency: "EUR",
    results: normalized.results,
  });

  await registerDealSearchContexts(normalized.results, {
    origin: request.origin,
    destination: request.destination,
    departureDate: request.departureDate,
    returnDate: request.returnDate,
  });

  return {
    currency: "EUR",
    searchId: createSearchId(),
    cached: false,
    results: normalized.results,
  };
}

export function mapProviderErrorToHttpStatus(error: ProviderError): number {
  switch (error.code) {
    case "PROVIDER_QUOTA_EXCEEDED":
      return 429;
    case "PROVIDER_TIMEOUT":
      return 504;
    default:
      return 502;
  }
}
