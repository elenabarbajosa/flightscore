export type RateLimitRoute = "search" | "deal";

export interface RateLimitResult {
  allowed: boolean;
}

export interface RateLimiter {
  check(route: RateLimitRoute, identifier: string): Promise<RateLimitResult>;
}

export interface RateLimitPolicy {
  limit: number;
  windowSeconds: number;
}

export const SEARCH_RATE_LIMIT: RateLimitPolicy = {
  limit: 10,
  windowSeconds: 600,
};

export const DEAL_RATE_LIMIT: RateLimitPolicy = {
  limit: 20,
  windowSeconds: 600,
};

export const SEARCH_RATE_LIMIT_NAMESPACE = "flightscore:rate:search:";
export const DEAL_RATE_LIMIT_NAMESPACE = "flightscore:rate:deal:";

export function buildRateLimitRedisKey(
  route: RateLimitRoute,
  identifier: string,
): string {
  const namespace =
    route === "search"
      ? SEARCH_RATE_LIMIT_NAMESPACE
      : DEAL_RATE_LIMIT_NAMESPACE;

  return `${namespace}${identifier}`;
}

export function getRateLimitPolicy(route: RateLimitRoute): RateLimitPolicy {
  return route === "search" ? SEARCH_RATE_LIMIT : DEAL_RATE_LIMIT;
}
