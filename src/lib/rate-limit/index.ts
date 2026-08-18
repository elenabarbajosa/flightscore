import { isRedisBackendEnabled, resolveRedisJsonStore } from "@/lib/cache/backend";
import {
  buildRateLimitRedisKey,
  getRateLimitPolicy,
  type RateLimiter,
  type RateLimitRoute,
} from "@/lib/rate-limit/constants";

interface CounterEntry {
  count: number;
  expiresAt: number;
}

function createInMemoryRateLimiter(): RateLimiter {
  const store = new Map<string, CounterEntry>();

  return {
    async check(route, identifier) {
      const policy = getRateLimitPolicy(route);
      const key = buildRateLimitRedisKey(route, identifier);
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.expiresAt <= now) {
        store.set(key, {
          count: 1,
          expiresAt: now + policy.windowSeconds * 1000,
        });

        return { allowed: true };
      }

      entry.count += 1;

      return { allowed: entry.count <= policy.limit };
    },
  };
}

function createRedisRateLimiter(): RateLimiter {
  const store = resolveRedisJsonStore();

  return {
    async check(route, identifier) {
      const policy = getRateLimitPolicy(route);
      const key = buildRateLimitRedisKey(route, identifier);
      const count = await store.increment(key, policy.windowSeconds);

      return { allowed: count <= policy.limit };
    },
  };
}

function createRateLimiter(): RateLimiter {
  if (isRedisBackendEnabled()) {
    return createRedisRateLimiter();
  }

  return createInMemoryRateLimiter();
}

let defaultRateLimiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!defaultRateLimiter) {
    defaultRateLimiter = createRateLimiter();
  }

  return defaultRateLimiter;
}

export function createRateLimiterForTests(
  implementation?: RateLimiter,
): RateLimiter {
  return implementation ?? createInMemoryRateLimiter();
}

export function resetDefaultRateLimiterForTests(): void {
  defaultRateLimiter = null;
}

export async function assertRateLimitAllowed(
  route: RateLimitRoute,
  identifier: string,
  rateLimiter: RateLimiter = getRateLimiter(),
): Promise<boolean> {
  const result = await rateLimiter.check(route, identifier);
  return result.allowed;
}
