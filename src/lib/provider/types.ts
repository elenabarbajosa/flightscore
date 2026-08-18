import type { CabinClass } from "@/lib/types/search";

export interface ProviderSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
}

export interface ProviderSegment {
  operatingCarrier: string;
  marketingCarrier: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
}

export interface ProviderLayoverHint {
  airport: string;
  durationMinutes: number;
  overnight?: boolean;
}

export interface ProviderJourney {
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  segments: ProviderSegment[];
  layoverHints: ProviderLayoverHint[];
}

export interface ProviderItinerary {
  id: string;
  price: number;
  currency: string;
  totalDurationMinutes: number;
  stopCount: number;
  outbound: ProviderJourney;
  inbound: ProviderJourney | null;
  /** Opaque provider-neutral reference for lazy booking/deal resolution. Not a final URL. */
  dealReference: string | null;
}

export interface ProviderDealSearchContext {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
}

export interface ProviderDealResolutionRequest {
  dealReference: string;
  searchContext: ProviderDealSearchContext;
}

export interface ProviderBookingRequest {
  method: "GET" | "POST";
  url: string;
  postBody?: string;
}

export interface ProviderBookingOption {
  sellerName: string;
  isAirlineDirect: boolean;
  priceEur: number | null;
  isSeparateTickets: boolean;
  bookingRequest: ProviderBookingRequest | null;
  bookingPhone?: string;
}

export interface ProviderDealResolutionResult {
  options: ProviderBookingOption[];
}

export interface ProviderResolvedDestination {
  redirectUrl: string;
  sellerName: string;
}

export interface ProviderSearchResult {
  currency: string;
  itineraries: ProviderItinerary[];
}

export interface FlightProvider {
  search(params: ProviderSearchParams): Promise<ProviderSearchResult>;
  resolveDeal(
    request: ProviderDealResolutionRequest,
  ): Promise<ProviderDealResolutionResult>;
  resolveBookingDestination(
    option: ProviderBookingOption,
  ): Promise<ProviderResolvedDestination>;
}
