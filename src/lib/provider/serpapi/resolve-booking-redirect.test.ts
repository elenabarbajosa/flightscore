import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveBookingDestination } from "@/lib/provider/serpapi/resolve-booking-redirect";
import type { ProviderBookingOption } from "@/lib/provider/types";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

const googleBookingUrl = "https://www.google.com/travel/clk/f";

function createResponse(status: number, responseUrl?: string): Response {
  const response = new Response(null, { status });

  if (responseUrl) {
    Object.defineProperty(response, "url", {
      value: responseUrl,
    });
  }

  return response;
}

function createOption(
  overrides: Partial<ProviderBookingOption> = {},
): ProviderBookingOption {
  return {
    sellerName: "BudgetAir",
    isAirlineDirect: false,
    priceEur: 155,
    isSeparateTickets: false,
    bookingRequest: {
      method: "POST",
      url: googleBookingUrl,
      postBody: "u=test-post-data",
    },
    ...overrides,
  };
}

describe("resolveBookingDestination", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs booking_request post_data and follows validated redirect hops", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "https://airline.example/book?ref=1" },
        }),
      )
      .mockResolvedValueOnce(
        createResponse(200, "https://airline.example/book?ref=1"),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveBookingDestination(createOption());

    expect(result.redirectUrl).toBe("https://airline.example/book?ref=1");
    expect(result.sellerName).toBe("BudgetAir");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: "u=test-post-data",
    });
  });

  it("supports GET booking requests when post_data is absent", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "https://airline.example/get-booking" },
        }),
      )
      .mockResolvedValueOnce(
        createResponse(200, "https://airline.example/get-booking"),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveBookingDestination(
      createOption({
        bookingRequest: {
          method: "GET",
          url: googleBookingUrl,
        },
      }),
    );

    expect(result.redirectUrl).toBe("https://airline.example/get-booking");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "GET" });
  });

  it("rejects unsafe initial booking_request URLs before fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      resolveBookingDestination(
        createOption({
          bookingRequest: {
            method: "POST",
            url: "https://evil.example/redirect",
            postBody: "u=test",
          },
        }),
      ),
    ).rejects.toThrow("Booking request host is not allowed.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unsafe redirect targets before following them", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { Location: "http://insecure.example/book" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveBookingDestination(createOption())).rejects.toThrow(
      "Only HTTPS destinations are allowed.",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows validated HTML meta refresh redirects from Google booking responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          "<html><head><meta content=\"0;url='https://airline.example/meta-book'\"></head></html>",
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          },
        ),
      )
      .mockResolvedValueOnce(
        createResponse(200, "https://airline.example/meta-book"),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveBookingDestination(createOption());

    expect(result.redirectUrl).toBe("https://airline.example/meta-book");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "GET" });
  });

  it("accepts safe OTA landing URLs that return 403 to server-side clients", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          "<html><head><meta content=\"0;url='https://airline.example/meta-book'\"></head></html>",
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          },
        ),
      )
      .mockResolvedValueOnce(createResponse(403, "https://airline.example/meta-book"));

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveBookingDestination(createOption());

    expect(result.redirectUrl).toBe("https://airline.example/meta-book");
  });

  it("does not return the Google click-tracker URL as the final destination", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("<html><head><title>Google</title></head></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveBookingDestination(createOption())).rejects.toThrow(
      "Booking redirect ended on Google tracker",
    );
  });
});
