/**
 * Schengen Area member states used for connection classification.
 * Source basis: EU Schengen membership as of project documentation (Aug 2026).
 */
export const SCHENGEN_COUNTRY_CODES = new Set<string>([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
]);

export function isSchengenCountry(countryCode: string): boolean {
  return SCHENGEN_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}

export function getSchengenCountryCodes(): readonly string[] {
  return [...SCHENGEN_COUNTRY_CODES].sort();
}
