import type { CabinClass, Itinerary, SearchRequest } from "@/lib/types/search";

import { isRedisBackendEnabled, resolveRedisJsonStore } from "@/lib/cache/backend";
import { getCacheTtlSeconds } from "@/lib/server/env";

const ONE_WAY_SENTINEL = "ONE_WAY";
const SEARCH_CACHE_NAMESPACE = "flightscore:search:";

export interface SearchCacheKey {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: CabinClass;
}

export interface CachedSearchPayload {
  currency: "EUR";
  results: Itinerary[];
}

interface CacheEntry {
  expiresAt: number;
  value: CachedSearchPayload;
}

export interface SearchCache {
  get(key: SearchCacheKey): Promise<CachedSearchPayload | null>;
  set(key: SearchCacheKey, payload: CachedSearchPayload): Promise<void>;
  clear(): Promise<void>;
}

export function buildSearchCacheKey(request: SearchRequest): SearchCacheKey {
  return {
    origin: request.origin,
    destination: request.destination,
    departureDate: request.departureDate,
    returnDate: request.returnDate ?? ONE_WAY_SENTINEL,
    passengers: request.passengers,
    cabinClass: request.cabinClass,
  };
}

export function serializeSearchCacheKey(key: SearchCacheKey): string {
  return [
    key.origin,
    key.destination,
    key.departureDate,
    key.returnDate,
    String(key.passengers),
    key.cabinClass,
  ].join("|");
}

export function buildSearchCacheRedisKey(key: SearchCacheKey): string {
  return `${SEARCH_CACHE_NAMESPACE}${serializeSearchCacheKey(key)}`;
}

function createInMemorySearchCache(ttlSeconds: number): SearchCache {
  const store = new Map<string, CacheEntry>();

  return {
    async get(key) {
      const serializedKey = serializeSearchCacheKey(key);
      const entry = store.get(serializedKey);

      if (!entry) {
        return null;
      }

      if (entry.expiresAt <= Date.now()) {
        store.delete(serializedKey);
        return null;
      }

      return entry.value;
    },

    async set(key, payload) {
      store.set(serializeSearchCacheKey(key), {
        expiresAt: Date.now() + ttlSeconds * 1000,
        value: payload,
      });
    },

    async clear() {
      store.clear();
    },
  };
}

function createRedisSearchCache(ttlSeconds: number): SearchCache {
  const store = resolveRedisJsonStore();

  return {
    async get(key) {
      return store.get<CachedSearchPayload>(buildSearchCacheRedisKey(key));
    },

    async set(key, payload) {
      await store.set(buildSearchCacheRedisKey(key), payload, ttlSeconds);
    },

    async clear() {
      // Redis-backed caches are shared; tests inject in-memory implementations instead.
    },
  };
}

function createSearchCache(ttlSeconds = getCacheTtlSeconds()): SearchCache {
  if (isRedisBackendEnabled()) {
    return createRedisSearchCache(ttlSeconds);
  }

  return createInMemorySearchCache(ttlSeconds);
}

let defaultSearchCache: SearchCache | null = null;

export function getSearchCache(): SearchCache {
  if (!defaultSearchCache) {
    defaultSearchCache = createSearchCache();
  }

  return defaultSearchCache;
}

export function createSearchCacheForTests(ttlSeconds: number): SearchCache {
  return createInMemorySearchCache(ttlSeconds);
}

export function resetDefaultSearchCacheForTests(): void {
  defaultSearchCache = null;
}

export { ONE_WAY_SENTINEL, SEARCH_CACHE_NAMESPACE };
