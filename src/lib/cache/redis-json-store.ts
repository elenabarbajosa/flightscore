import { Redis } from "@upstash/redis";

import type { UpstashRedisConfig } from "@/lib/server/env";

export interface RedisJsonStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  increment(key: string, ttlSeconds: number): Promise<number>;
}

export function createRedisJsonStore(config: UpstashRedisConfig): RedisJsonStore {
  const redis = new Redis({
    url: config.url,
    token: config.token,
  });

  return {
    async get<T>(key: string): Promise<T | null> {
      const value = await redis.get<T>(key);
      return value ?? null;
    },

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
      await redis.set(key, value, { ex: ttlSeconds });
    },

    async increment(key: string, ttlSeconds: number): Promise<number> {
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, ttlSeconds);
      }

      return count;
    },
  };
}

let defaultRedisJsonStore: RedisJsonStore | null = null;

export function getRedisJsonStore(config: UpstashRedisConfig): RedisJsonStore {
  if (!defaultRedisJsonStore) {
    defaultRedisJsonStore = createRedisJsonStore(config);
  }

  return defaultRedisJsonStore;
}

export function resetDefaultRedisJsonStoreForTests(): void {
  defaultRedisJsonStore = null;
}

export function createRedisJsonStoreForTests(
  implementation: RedisJsonStore,
): RedisJsonStore {
  return implementation;
}
