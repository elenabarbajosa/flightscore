import { createHash } from "node:crypto";

export interface CachedDealResolution {
  redirectUrl: string;
  sellerName: string;
}

export interface DealCache {
  get(dealReference: string): CachedDealResolution | null;
  set(dealReference: string, value: CachedDealResolution): void;
  clear(): void;
}

const DEFAULT_DEAL_CACHE_TTL_SECONDS = 300;

interface CacheEntry {
  expiresAt: number;
  value: CachedDealResolution;
}

function hashDealReference(dealReference: string): string {
  return createHash("sha256").update(dealReference).digest("hex");
}

function createInMemoryDealCache(
  ttlSeconds = DEFAULT_DEAL_CACHE_TTL_SECONDS,
): DealCache {
  const store = new Map<string, CacheEntry>();

  return {
    get(dealReference) {
      const key = hashDealReference(dealReference);
      const entry = store.get(key);

      if (!entry) {
        return null;
      }

      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }

      return entry.value;
    },
    set(dealReference, value) {
      store.set(hashDealReference(dealReference), {
        expiresAt: Date.now() + ttlSeconds * 1000,
        value,
      });
    },
    clear() {
      store.clear();
    },
  };
}

let defaultDealCache: DealCache | null = null;

export function getDealCache(): DealCache {
  if (!defaultDealCache) {
    defaultDealCache = createInMemoryDealCache();
  }

  return defaultDealCache;
}

export function createDealCacheForTests(ttlSeconds: number): DealCache {
  return createInMemoryDealCache(ttlSeconds);
}

export function resetDefaultDealCacheForTests(): void {
  defaultDealCache = null;
}
