import { createHash } from "node:crypto";

import { isRedisBackendEnabled, resolveRedisJsonStore } from "@/lib/cache/backend";

const DEFAULT_DEAL_CACHE_TTL_SECONDS = 300;
const DEAL_RESOLUTION_CACHE_NAMESPACE = "flightscore:deal-resolution:";

export interface CachedDealResolution {
  redirectUrl: string;
  sellerName: string;
}

interface CacheEntry {
  expiresAt: number;
  value: CachedDealResolution;
}

export interface DealCache {
  get(dealReference: string): Promise<CachedDealResolution | null>;
  set(dealReference: string, value: CachedDealResolution): Promise<void>;
  clear(): Promise<void>;
}

function hashDealReference(dealReference: string): string {
  return createHash("sha256").update(dealReference).digest("hex");
}

export function buildDealResolutionRedisKey(dealReference: string): string {
  return `${DEAL_RESOLUTION_CACHE_NAMESPACE}${hashDealReference(dealReference)}`;
}

function createInMemoryDealCache(ttlSeconds: number): DealCache {
  const store = new Map<string, CacheEntry>();

  return {
    async get(dealReference) {
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

    async set(dealReference, value) {
      store.set(hashDealReference(dealReference), {
        expiresAt: Date.now() + ttlSeconds * 1000,
        value,
      });
    },

    async clear() {
      store.clear();
    },
  };
}

function createRedisDealCache(ttlSeconds: number): DealCache {
  const store = resolveRedisJsonStore();

  return {
    async get(dealReference) {
      return store.get<CachedDealResolution>(
        buildDealResolutionRedisKey(dealReference),
      );
    },

    async set(dealReference, value) {
      await store.set(
        buildDealResolutionRedisKey(dealReference),
        value,
        ttlSeconds,
      );
    },

    async clear() {},
  };
}

function createDealCache(
  ttlSeconds = DEFAULT_DEAL_CACHE_TTL_SECONDS,
): DealCache {
  if (isRedisBackendEnabled()) {
    return createRedisDealCache(ttlSeconds);
  }

  return createInMemoryDealCache(ttlSeconds);
}

let defaultDealCache: DealCache | null = null;

export function getDealCache(): DealCache {
  if (!defaultDealCache) {
    defaultDealCache = createDealCache();
  }

  return defaultDealCache;
}

export function createDealCacheForTests(ttlSeconds: number): DealCache {
  return createInMemoryDealCache(ttlSeconds);
}

export function resetDefaultDealCacheForTests(): void {
  defaultDealCache = null;
}

export { DEAL_RESOLUTION_CACHE_NAMESPACE, DEFAULT_DEAL_CACHE_TTL_SECONDS };
