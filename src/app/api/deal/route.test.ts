import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProviderError } from "@/lib/provider/errors";
import { POST } from "@/app/api/deal/route";

const runDealResolutionMock = vi.fn();

vi.mock("@/lib/deal/run-deal-resolution", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/deal/run-deal-resolution")>();

  return {
    ...actual,
    runDealResolution: (...args: Parameters<typeof actual.runDealResolution>) =>
      runDealResolutionMock(...args),
  };
});

function createPostRequest(body: unknown): Request {
  return new Request("http://localhost/api/deal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/deal", () => {
  beforeEach(() => {
    runDealResolutionMock.mockReset();
  });

  it("returns a safe redirect destination without provider internals", async () => {
    runDealResolutionMock.mockResolvedValue({
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });

    const response = await POST(
      createPostRequest({
        dealReference: "token-123",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      redirectUrl: "https://airline.example/book",
      sellerName: "Example Air",
    });
  });

  it("returns INVALID_INPUT for malformed requests", async () => {
    const response = await POST(createPostRequest({ dealReference: "" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_INPUT",
      field: "dealReference",
    });
  });

  it("never exposes raw provider fields in provider error responses", async () => {
    runDealResolutionMock.mockRejectedValue(
      new ProviderError("PROVIDER_REQUEST_FAILED", "provider failed"),
    );

    const response = await POST(
      createPostRequest({
        dealReference: "token-123",
      }),
    );

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload).toEqual({ error: "PROVIDER_ERROR" });
    expect(JSON.stringify(payload)).not.toContain("token-123");
    expect(JSON.stringify(payload)).not.toContain("post_data");
  });
});
