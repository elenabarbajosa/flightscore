import type {
  SerpApiBookingOptionEntry,
  SerpApiGoogleFlightsResponse,
} from "@/lib/provider/serpapi/types";

const googleBookingUrl = "https://www.google.com/travel/clk/f";

export const togetherAirlineOption: SerpApiBookingOptionEntry = {
  together: {
    book_with: "British Airways",
    airline: true,
    price: 188,
    local_prices: [{ currency: "EUR", price: 173 }],
    booking_request: {
      url: googleBookingUrl,
      post_data: "u=test-post-data-airline",
    },
  },
};

export const togetherOtaOption: SerpApiBookingOptionEntry = {
  together: {
    book_with: "BudgetAir",
    airline: false,
    price: 160,
    local_prices: [{ currency: "EUR", price: 155 }],
    booking_request: {
      url: googleBookingUrl,
      post_data: "u=test-post-data-ota",
    },
  },
};

export const tiedPriceAirlineOption: SerpApiBookingOptionEntry = {
  together: {
    book_with: "Zeta Air",
    airline: true,
    price: 150,
    local_prices: [{ currency: "EUR", price: 150 }],
    booking_request: {
      url: googleBookingUrl,
      post_data: "u=test-post-data-zeta",
    },
  },
};

export const tiedPriceOtaOption: SerpApiBookingOptionEntry = {
  together: {
    book_with: "Alpha Travel",
    airline: false,
    price: 150,
    local_prices: [{ currency: "EUR", price: 150 }],
    booking_request: {
      url: googleBookingUrl,
      post_data: "u=test-post-data-alpha",
    },
  },
};

export const separateTicketsOnlyEntry: SerpApiBookingOptionEntry = {
  separate_tickets: true,
  together: {
    book_with: "Delta, American",
    airline: true,
    price: 303,
  },
  departing: {
    book_with: "Delta",
    airline: true,
    price: 134,
    booking_request: {
      url: googleBookingUrl,
      post_data: "u=test-post-data-departing",
    },
  },
  returning: {
    book_with: "American",
    airline: true,
    price: 169,
    booking_request: {
      url: googleBookingUrl,
      post_data: "u=test-post-data-returning",
    },
  },
};

export const getStyleBookingOption: SerpApiBookingOptionEntry = {
  together: {
    book_with: "Example Air",
    airline: true,
    price: 120,
    booking_request: {
      url: googleBookingUrl,
    },
  },
};

export const phoneOnlyBookingOption: SerpApiBookingOptionEntry = {
  together: {
    book_with: "Phone Seller",
    airline: false,
    price: 999,
    booking_phone: "+1 555 0100",
  },
};

export const bookingOptionsFixtureResponse: SerpApiGoogleFlightsResponse = {
  booking_options: [togetherAirlineOption, togetherOtaOption],
};

export const separateTicketsFixtureResponse: SerpApiGoogleFlightsResponse = {
  booking_options: [separateTicketsOnlyEntry],
};
