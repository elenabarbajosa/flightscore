import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

const GOOGLE_BOOKING_REQUEST_HOST = "www.google.com";
const GOOGLE_BOOKING_REQUEST_PATH = "/travel/clk/f";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

function parseIpv4(address: string): number[] | null {
  const parts = address.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => Number.parseInt(part, 10));

  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
}

function isPrivateOrBlockedIpv4(address: string): boolean {
  const octets = parseIpv4(address);

  if (!octets) {
    return true;
  }

  const [a, b, c, d] = octets;

  if (a === 127) {
    return true;
  }

  if (a === 10) {
    return true;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  if (a === 169 && b === 254) {
    return true;
  }

  if (a === 0) {
    return true;
  }

  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  if (a === 192 && b === 0 && c === 0) {
    return true;
  }

  if (a === 192 && b === 0 && c === 2) {
    return true;
  }

  if (a === 198 && (b === 18 || b === 19)) {
    return true;
  }

  if (a === 198 && b === 51 && c === 100) {
    return true;
  }

  if (a === 203 && b === 0 && c === 113) {
    return true;
  }

  if (a === 255 && b === 255 && c === 255 && d === 255) {
    return true;
  }

  return false;
}

function isPrivateOrBlockedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.") ||
    normalized.startsWith("::ffff:172.16.") ||
    normalized.startsWith("::ffff:172.17.") ||
    normalized.startsWith("::ffff:172.18.") ||
    normalized.startsWith("::ffff:172.19.") ||
    normalized.startsWith("::ffff:172.2") ||
    normalized.startsWith("::ffff:172.30.") ||
    normalized.startsWith("::ffff:172.31.")
  ) {
    return true;
  }

  return false;
}

function isBlockedIpAddress(address: string): boolean {
  const ipVersion = isIP(address);

  if (ipVersion === 4) {
    return isPrivateOrBlockedIpv4(address);
  }

  if (ipVersion === 6) {
    return isPrivateOrBlockedIpv6(address);
  }

  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (normalized.endsWith(".local")) {
    return true;
  }

  if (normalized.endsWith(".localhost")) {
    return true;
  }

  const ipVersion = isIP(normalized);

  if (ipVersion !== 0) {
    return isBlockedIpAddress(normalized);
  }

  return false;
}

export async function assertSafeExternalHttpsUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("URL is malformed.");
  }

  if (parsed.protocol !== "https:") {
    throw new UnsafeUrlError("Only HTTPS destinations are allowed.");
  }

  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError("Credentials in URLs are not allowed.");
  }

  if (!parsed.hostname) {
    throw new UnsafeUrlError("URL hostname is missing.");
  }

  const ipVersion = isIP(parsed.hostname);

  if (ipVersion !== 0) {
    if (isBlockedIpAddress(parsed.hostname)) {
      throw new UnsafeUrlError("URL IP address is not allowed.");
    }

    return parsed;
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new UnsafeUrlError("URL hostname is not allowed.");
  }

  try {
    const records = await lookup(parsed.hostname, { all: true, verbatim: true });
    const resolvedRecords = Array.isArray(records) ? records : [records];

    for (const record of resolvedRecords) {
      if (isBlockedIpAddress(record.address)) {
        throw new UnsafeUrlError("URL resolves to a blocked address.");
      }
    }
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      throw error;
    }

    throw new UnsafeUrlError("URL hostname could not be resolved.");
  }

  return parsed;
}

export async function assertGoogleBookingRequestUrl(rawUrl: string): Promise<URL> {
  const parsed = await assertSafeExternalHttpsUrl(rawUrl);

  if (parsed.hostname !== GOOGLE_BOOKING_REQUEST_HOST) {
    throw new UnsafeUrlError("Booking request host is not allowed.");
  }

  if (parsed.pathname !== GOOGLE_BOOKING_REQUEST_PATH) {
    throw new UnsafeUrlError("Booking request path is not allowed.");
  }

  return parsed;
}

export function isGoogleBookingRequestUrl(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    url.hostname === GOOGLE_BOOKING_REQUEST_HOST &&
    url.pathname === GOOGLE_BOOKING_REQUEST_PATH
  );
}
