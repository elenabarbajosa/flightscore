export type ConnectionType = "DOMESTIC" | "SCHENGEN" | "INTERNATIONAL";

export type CabinClass =
  | "ECONOMY"
  | "PREMIUM_ECONOMY"
  | "BUSINESS"
  | "FIRST";

export interface SearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
}

export interface Segment {
  operatingCarrier: string;
  marketingCarrier: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
}

export interface Layover {
  airport: string;
  durationMinutes: number;
  airportChange: boolean;
  connectionType: ConnectionType;
}

export interface Journey {
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  segments: Segment[];
  layovers: Layover[];
}

export interface Itinerary {
  id: string;
  price: number;
  totalDurationMinutes: number;
  stopCount: number;
  outbound: Journey;
  inbound: Journey | null;
  /** Opaque provider-neutral reference for lazy server-side deal resolution. Not a booking URL. */
  dealReference: string | null;
}

export interface SearchResponse {
  currency: "EUR";
  searchId: string;
  cached: boolean;
  results: Itinerary[];
}

export type SearchErrorCode =
  | "INVALID_INPUT"
  | "QUOTA_EXCEEDED"
  | "PROVIDER_ERROR"
  | "TIMEOUT";

export interface SearchErrorResponse {
  error: SearchErrorCode;
  field?: string;
}
