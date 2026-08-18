import {
  getRedisJsonStore,
  resetDefaultRedisJsonStoreForTests,
  type RedisJsonStore,
} from "@/lib/cache/redis-json-store";
import {
  getUpstashRedisConfig,
  shouldUseRedisBackend,
} from "@/lib/server/env";

let cachedStore: RedisJsonStore | null = null;

export function resolveRedisJsonStore(): RedisJsonStore {
  if (cachedStore) {
    return cachedStore;
  }

  const config = getUpstashRedisConfig();

  if (!config) {
    throw new Error("Redis configuration is required but missing");
  }

  cachedStore = getRedisJsonStore(config);
  return cachedStore;
}

export function isRedisBackendEnabled(): boolean {
  return shouldUseRedisBackend();
}

export function setRedisJsonStoreForTests(store: RedisJsonStore | null): void {
  cachedStore = store;
}

export function resetCacheBackendForTests(): void {
  cachedStore = null;
  resetDefaultRedisJsonStoreForTests();
}
