import { createHash } from "node:crypto";

const DEFAULT_CACHE_TTL_SECONDS = 1800;

export interface DealSearchContext {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
}

interface CacheEntry {
  expiresAt: number;
  value: DealSearchContext;
}

export interface DealContextCache {
  register(dealReference: string, context: DealSearchContext): void;
  get(dealReference: string): DealSearchContext | null;
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

function hashDealReference(dealReference: string): string {
  return createHash("sha256").update(dealReference).digest("hex");
}

function createInMemoryDealContextCache(
  ttlSeconds = parseCacheTtlSeconds(),
): DealContextCache {
  const store = new Map<string, CacheEntry>();

  return {
    register(dealReference, context) {
      store.set(hashDealReference(dealReference), {
        expiresAt: Date.now() + ttlSeconds * 1000,
        value: context,
      });
    },
    get(dealReference) {
      const entry = store.get(hashDealReference(dealReference));

      if (!entry) {
        return null;
      }

      if (entry.expiresAt <= Date.now()) {
        store.delete(hashDealReference(dealReference));
        return null;
      }

      return entry.value;
    },
    clear() {
      store.clear();
    },
  };
}

let defaultDealContextCache: DealContextCache | null = null;

export function getDealContextCache(): DealContextCache {
  if (!defaultDealContextCache) {
    defaultDealContextCache = createInMemoryDealContextCache();
  }

  return defaultDealContextCache;
}

export function createDealContextCacheForTests(ttlSeconds: number): DealContextCache {
  return createInMemoryDealContextCache(ttlSeconds);
}

export function resetDefaultDealContextCacheForTests(): void {
  defaultDealContextCache = null;
}

export function registerDealSearchContexts(
  results: Array<{ dealReference: string | null }>,
  context: DealSearchContext,
  cache: DealContextCache = getDealContextCache(),
): void {
  for (const result of results) {
    if (result.dealReference) {
      cache.register(result.dealReference, context);
    }
  }
}
