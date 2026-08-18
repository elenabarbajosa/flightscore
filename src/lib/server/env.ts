import { ServerConfigError } from "@/lib/server/errors";

const DEFAULT_CACHE_TTL_SECONDS = 1800;
const DEFAULT_SERPAPI_ENGINE = "google_flights";

export interface UpstashRedisConfig {
  url: string;
  token: string;
}

export interface SerpApiConfig {
  apiKey: string;
  engine: string;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readRequiredEnv(name: string): string {
  const value = readOptionalEnv(name);

  if (!value) {
    throw new ServerConfigError(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getVercelEnv(): string | undefined {
  return readOptionalEnv("VERCEL_ENV");
}

export function isVercelProduction(): boolean {
  return getVercelEnv() === "production";
}

export function getUpstashRedisConfig(): UpstashRedisConfig | null {
  const url = readOptionalEnv("UPSTASH_REDIS_REST_URL");
  const token = readOptionalEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url && !token) {
    return null;
  }

  if (!url || !token) {
    throw new ServerConfigError(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set",
    );
  }

  return { url, token };
}

export function hasRedisConfig(): boolean {
  return getUpstashRedisConfig() !== null;
}

export function assertProductionRedisConfig(): void {
  if (isVercelProduction() && !hasRedisConfig()) {
    throw new ServerConfigError(
      "Upstash Redis is required when VERCEL_ENV=production",
    );
  }
}

export function shouldUseRedisBackend(): boolean {
  assertProductionRedisConfig();

  return hasRedisConfig();
}

export function getCacheTtlSeconds(): number {
  const rawValue = readOptionalEnv("CACHE_TTL_SECONDS");

  if (!rawValue) {
    return DEFAULT_CACHE_TTL_SECONDS;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CACHE_TTL_SECONDS;
  }

  return parsed;
}

export function getSerpApiConfig(): SerpApiConfig {
  return {
    apiKey: readRequiredEnv("SERPAPI_API_KEY"),
    engine: readOptionalEnv("SERPAPI_ENGINE") ?? DEFAULT_SERPAPI_ENGINE,
  };
}
