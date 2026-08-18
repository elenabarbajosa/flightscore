import { createHash } from "node:crypto";

const LOCAL_DEV_CLIENT_IDENTIFIER = "local-dev-client";

function isValidIpAddress(value: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) {
    return true;
  }

  return value.includes(":");
}

function normalizeIpCandidate(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withoutPort = trimmed.startsWith("[")
    ? trimmed.slice(1, trimmed.indexOf("]"))
    : trimmed.split(":")[0];

  if (!withoutPort || !isValidIpAddress(withoutPort)) {
    return null;
  }

  return withoutPort;
}

export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    for (const part of forwardedFor.split(",")) {
      const candidate = normalizeIpCandidate(part);

      if (candidate) {
        return candidate;
      }
    }
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    const candidate = normalizeIpCandidate(realIp);

    if (candidate) {
      return candidate;
    }
  }

  return LOCAL_DEV_CLIENT_IDENTIFIER;
}

export function hashRateLimitIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex");
}

export function getRateLimitIdentifier(request: Request): string {
  return hashRateLimitIdentifier(extractClientIp(request));
}

export { LOCAL_DEV_CLIENT_IDENTIFIER };
