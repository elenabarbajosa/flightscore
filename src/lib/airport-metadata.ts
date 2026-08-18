import airportsData from "@/data/airports.json";

export interface AirportRecord {
  iata: string;
  name: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

const airports = airportsData as AirportRecord[];

const airportsByIata = new Map(
  airports.map((airport) => [airport.iata.toUpperCase(), airport]),
);

export function getAirportByIata(iata: string): AirportRecord | undefined {
  return airportsByIata.get(iata.trim().toUpperCase());
}

export const airportMetadataCount = airports.length;
