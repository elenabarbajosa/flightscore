import type { CabinClass, Itinerary, SearchRequest } from "@/lib/types/search";

const ONE_WAY_SENTINEL = "ONE_WAY";
const DEFAULT_CACHE_TTL_SECONDS = 1800;

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
  get(key: SearchCacheKey): CachedSearchPayload | null;
  set(key: SearchCacheKey, payload: CachedSearchPayload): void;
  clear(): void;
}

function parseCacheTtlSeconds(): number {
  const rawValue = process.env.CACHE_TTL_SECONDS;

  if (!rawValue) {
    return DEFAULT_CACHE_TTL_SECONDS;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CACHE_TTL_SECONDS;
  }

  return parsed;
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

function createInMemorySearchCache(ttlSeconds = parseCacheTtlSeconds()): SearchCache {
  const store = new Map<string, CacheEntry>();

  return {
    get(key) {
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
    set(key, payload) {
      store.set(serializeSearchCacheKey(key), {
        expiresAt: Date.now() + ttlSeconds * 1000,
        value: payload,
      });
    },
    clear() {
      store.clear();
    },
  };
}

let defaultSearchCache: SearchCache | null = null;

export function getSearchCache(): SearchCache {
  if (!defaultSearchCache) {
    defaultSearchCache = createInMemorySearchCache();
  }

  return defaultSearchCache;
}

export function createSearchCacheForTests(ttlSeconds: number): SearchCache {
  return createInMemorySearchCache(ttlSeconds);
}

export function resetDefaultSearchCacheForTests(): void {
  defaultSearchCache = null;
}

export { ONE_WAY_SENTINEL };
