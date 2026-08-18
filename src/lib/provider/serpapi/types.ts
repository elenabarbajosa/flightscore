export interface SerpApiAirport {
  name: string;
  id: string;
  time: string;
}

export interface SerpApiFlightSegment {
  departure_airport: SerpApiAirport;
  arrival_airport: SerpApiAirport;
  duration: number;
  flight_number: string;
  airline: string;
  airplane?: string;
  airline_logo?: string;
  travel_class?: string;
  ticket_also_sold_by?: string[];
  legroom?: string;
  extensions?: string[];
}

export interface SerpApiLayover {
  duration: number;
  name: string;
  id: string;
  overnight?: boolean;
}

export interface SerpApiFlightOffer {
  flights: SerpApiFlightSegment[];
  layovers?: SerpApiLayover[];
  total_duration: number;
  price: number;
  type?: string;
  departure_token?: string;
  booking_token?: string;
  airline_logo?: string;
  extensions?: string[];
  carbon_emissions?: {
    this_flight?: number;
    typical_for_this_route?: number;
    difference_percent?: number;
  };
}

export interface SerpApiGoogleFlightsResponse {
  search_metadata?: {
    id?: string;
    status?: string;
  };
  search_parameters?: Record<string, unknown>;
  best_flights?: SerpApiFlightOffer[];
  other_flights?: SerpApiFlightOffer[];
  price_insights?: Record<string, unknown>;
  airports?: Record<string, unknown>[];
  error?: string;
}

export type SerpApiQueryParams = Record<string, string>;
