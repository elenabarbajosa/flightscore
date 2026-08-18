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

export interface ProviderSearchResult {
  currency: string;
  itineraries: ProviderItinerary[];
}

export interface FlightProvider {
  search(params: ProviderSearchParams): Promise<ProviderSearchResult>;
}
