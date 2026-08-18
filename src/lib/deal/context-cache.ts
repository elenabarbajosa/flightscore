import { createHash } from "node:crypto";

import { isRedisBackendEnabled, resolveRedisJsonStore } from "@/lib/cache/backend";
import { getCacheTtlSeconds } from "@/lib/server/env";

const DEAL_CONTEXT_CACHE_NAMESPACE = "flightscore:deal-context:";

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
  register(dealReference: string, context: DealSearchContext): Promise<void>;
  get(dealReference: string): Promise<DealSearchContext | null>;
  clear(): Promise<void>;
}

function hashDealReference(dealReference: string): string {
  return createHash("sha256").update(dealReference).digest("hex");
}

export function buildDealContextRedisKey(dealReference: string): string {
  return `${DEAL_CONTEXT_CACHE_NAMESPACE}${hashDealReference(dealReference)}`;
}

function createInMemoryDealContextCache(ttlSeconds: number): DealContextCache {
  const store = new Map<string, CacheEntry>();

  return {
    async register(dealReference, context) {
      store.set(hashDealReference(dealReference), {
        expiresAt: Date.now() + ttlSeconds * 1000,
        value: context,
      });
    },

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

    async clear() {
      store.clear();
    },
  };
}

function createRedisDealContextCache(ttlSeconds: number): DealContextCache {
  const store = resolveRedisJsonStore();

  return {
    async register(dealReference, context) {
      await store.set(
        buildDealContextRedisKey(dealReference),
        context,
        ttlSeconds,
      );
    },

    async get(dealReference) {
      return store.get<DealSearchContext>(
        buildDealContextRedisKey(dealReference),
      );
    },

    async clear() {},
  };
}

function createDealContextCache(
  ttlSeconds = getCacheTtlSeconds(),
): DealContextCache {
  if (isRedisBackendEnabled()) {
    return createRedisDealContextCache(ttlSeconds);
  }

  return createInMemoryDealContextCache(ttlSeconds);
}

let defaultDealContextCache: DealContextCache | null = null;

export function getDealContextCache(): DealContextCache {
  if (!defaultDealContextCache) {
    defaultDealContextCache = createDealContextCache();
  }

  return defaultDealContextCache;
}

export function createDealContextCacheForTests(ttlSeconds: number): DealContextCache {
  return createInMemoryDealContextCache(ttlSeconds);
}

export function resetDefaultDealContextCacheForTests(): void {
  defaultDealContextCache = null;
}

export async function registerDealSearchContexts(
  results: Array<{ dealReference: string | null }>,
  context: DealSearchContext,
  cache: DealContextCache = getDealContextCache(),
): Promise<void> {
  await Promise.all(
    results
      .filter((result) => result.dealReference)
      .map((result) => cache.register(result.dealReference!, context)),
  );
}

export { DEAL_CONTEXT_CACHE_NAMESPACE };
