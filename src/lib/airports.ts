import airportsData from "@/data/airports.json";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

const airports = airportsData as Airport[];

const airportsByIata = new Map(
  airports.map((airport) => [airport.iata.toUpperCase(), airport]),
);

export function getAirports(): readonly Airport[] {
  return airports;
}

export function getAirportByIata(iata: string): Airport | undefined {
  return airportsByIata.get(iata.trim().toUpperCase());
}

export function searchAirports(query: string, limit = 8): Airport[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return airports
    .filter((airport) => {
      const haystack = [
        airport.iata,
        airport.name,
        airport.city,
        airport.countryCode,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .slice(0, limit);
}

export const airportCount = airports.length;
