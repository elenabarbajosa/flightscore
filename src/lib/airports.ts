import autocompleteData from "@/data/airports-autocomplete.json";

export interface AirportAutocompleteRecord {
  iata: string;
  name: string;
  city: string;
  countryCode: string;
}

const airports = autocompleteData as AirportAutocompleteRecord[];

const MATCH_TIER = {
  EXACT_IATA: 1,
  IATA_PREFIX: 2,
  CITY_PREFIX: 3,
  NAME_PREFIX: 4,
  SUBSTRING: 5,
} as const;

function getMatchTier(
  airport: AirportAutocompleteRecord,
  queryUpper: string,
  queryLower: string,
): number | null {
  const iata = airport.iata.toUpperCase();

  if (iata === queryUpper) {
    return MATCH_TIER.EXACT_IATA;
  }

  if (queryUpper && iata.startsWith(queryUpper)) {
    return MATCH_TIER.IATA_PREFIX;
  }

  const city = airport.city.toLowerCase();

  if (queryLower && city.startsWith(queryLower)) {
    return MATCH_TIER.CITY_PREFIX;
  }

  const name = airport.name.toLowerCase();

  if (queryLower && name.startsWith(queryLower)) {
    return MATCH_TIER.NAME_PREFIX;
  }

  const haystack = [iata, city, name, airport.countryCode.toLowerCase()].join(" ");

  if (queryLower && haystack.includes(queryLower)) {
    return MATCH_TIER.SUBSTRING;
  }

  return null;
}

export function getAirports(): readonly AirportAutocompleteRecord[] {
  return airports;
}

export function searchAirports(
  query: string,
  limit = 8,
): AirportAutocompleteRecord[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const queryUpper = trimmedQuery.toUpperCase();
  const queryLower = trimmedQuery.toLowerCase();

  return airports
    .map((airport) => ({
      airport,
      tier: getMatchTier(airport, queryUpper, queryLower),
    }))
    .filter(
      (
        entry,
      ): entry is {
        airport: AirportAutocompleteRecord;
        tier: number;
      } => entry.tier !== null,
    )
    .sort((left, right) => {
      if (left.tier !== right.tier) {
        return left.tier - right.tier;
      }

      return left.airport.iata.localeCompare(right.airport.iata);
    })
    .slice(0, limit)
    .map((entry) => entry.airport);
}

export const airportAutocompleteCount = airports.length;

export { getMatchTier, MATCH_TIER };
