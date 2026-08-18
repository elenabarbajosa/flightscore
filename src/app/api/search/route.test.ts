import { Temporal } from "@js-temporal/polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProviderError } from "@/lib/provider/errors";
import { POST } from "@/app/api/search/route";

const runSearchMock = vi.fn();

vi.mock("@/lib/search/run-search", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/search/run-search")>();

  return {
    ...actual,
    runSearch: (...args: Parameters<typeof actual.runSearch>) =>
      runSearchMock(...args),
  };
});

function futureDate(daysFromToday: number): string {
  return Temporal.Now.plainDateISO("UTC").add({ days: daysFromToday }).toString();
}

function createPostRequest(body: unknown): Request {
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/search", () => {
  beforeEach(() => {
    runSearchMock.mockReset();
  });

  it("returns a valid one-way response", async () => {
    runSearchMock.mockResolvedValue({
      currency: "EUR",
      searchId: "search-123",
      cached: false,
      results: [],
    });

    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(60),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      currency: "EUR",
      searchId: "search-123",
      cached: false,
      results: [],
    });
  });

  it("returns a valid round-trip response", async () => {
    const departureDate = futureDate(60);
    const returnDate = futureDate(74);

    runSearchMock.mockResolvedValue({
      currency: "EUR",
      searchId: "search-456",
      cached: false,
      results: [],
    });

    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate,
        returnDate,
        passengers: 2,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(200);
    expect(runSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: "LIS",
        destination: "NRT",
        departureDate,
        returnDate,
        passengers: 2,
      }),
    );
  });

  it("returns INVALID_INPUT for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "INVALID_INPUT" });
    expect(runSearchMock).not.toHaveBeenCalled();
  });

  it("returns INVALID_INPUT for missing required fields", async () => {
    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_INPUT",
      field: "passengers",
    });
    expect(runSearchMock).not.toHaveBeenCalled();
  });

  it("returns INVALID_INPUT for unknown airport codes before provider call", async () => {
    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "ZZZ",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_INPUT",
      field: "destination",
    });
    expect(runSearchMock).not.toHaveBeenCalled();
  });

  it("maps provider quota errors to HTTP 429", async () => {
    runSearchMock.mockRejectedValue(
      new ProviderError("PROVIDER_QUOTA_EXCEEDED", "quota"),
    );

    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: "QUOTA_EXCEEDED" });
  });

  it("maps provider timeout errors to HTTP 504", async () => {
    runSearchMock.mockRejectedValue(
      new ProviderError("PROVIDER_TIMEOUT", "timeout"),
    );

    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({ error: "TIMEOUT" });
  });

  it("maps generic provider failures to HTTP 502", async () => {
    runSearchMock.mockRejectedValue(
      new ProviderError("PROVIDER_REQUEST_FAILED", "failed"),
    );

    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "PROVIDER_ERROR" });
  });

  it("returns INTERNAL_ERROR for unexpected failures", async () => {
    runSearchMock.mockRejectedValue(new Error("unexpected"));

    const response = await POST(
      createPostRequest({
        origin: "LIS",
        destination: "NRT",
        departureDate: futureDate(30),
        passengers: 1,
        cabinClass: "ECONOMY",
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "INTERNAL_ERROR" });
    expect(JSON.stringify(body)).not.toContain("unexpected");
  });
});
