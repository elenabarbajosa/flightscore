/**
 * Builds src/data/airports.json from OurAirports open data.
 *
 * Source: https://ourairports.com/data/
 * License: Public Domain (see https://ourairports.com/about.html)
 *
 * Time zones are derived offline from latitude/longitude using tz-lookup (MIT).
 * Run manually when refreshing airport metadata: node scripts/build-airports.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import tzLookup from "tz-lookup";

const OURAIRPORTS_CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";
const OUTPUT_PATH = resolve(process.cwd(), "src/data/airports.json");

const TYPE_PRIORITY = new Map([
  ["large_airport", 4],
  ["medium_airport", 3],
  ["small_airport", 2],
  ["seaplane_base", 1],
  ["heliport", 0],
  ["closed", -1],
]);

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(content) {
  const lines = content.trim().split("\n");
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function isValidIata(code) {
  return /^[A-Z0-9]{3}$/.test(code);
}

function scoreRow(row) {
  const typeScore = TYPE_PRIORITY.get(row.type) ?? 0;
  const scheduledScore = row.scheduled_service === "yes" ? 10 : 0;

  return typeScore + scheduledScore;
}

function toAirportRecord(row) {
  const latitude = Number(row.latitude_deg);
  const longitude = Number(row.longitude_deg);

  return {
    iata: row.iata_code.trim().toUpperCase(),
    name: row.name.trim(),
    city: row.municipality.trim() || row.name.trim(),
    countryCode: row.iso_country.trim().toUpperCase(),
    latitude,
    longitude,
    timeZone: tzLookup(latitude, longitude),
  };
}

async function downloadCsv() {
  const response = await fetch(OURAIRPORTS_CSV_URL);

  if (!response.ok) {
    throw new Error(`Failed to download OurAirports CSV (${response.status})`);
  }

  return response.text();
}

async function main() {
  const csv = await downloadCsv();
  const rows = parseCsv(csv);
  const byIata = new Map();

  for (const row of rows) {
    const iata = row.iata_code?.trim().toUpperCase();

    if (!iata || !isValidIata(iata)) {
      continue;
    }

    const latitude = Number(row.latitude_deg);
    const longitude = Number(row.longitude_deg);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const candidate = toAirportRecord(row);
    const existing = byIata.get(iata);

    if (!existing || scoreRow(row) > scoreRow(existing.sourceRow)) {
      byIata.set(iata, { airport: candidate, sourceRow: row });
    }
  }

  const airports = [...byIata.values()]
    .map(({ airport }) => airport)
    .sort((left, right) => left.iata.localeCompare(right.iata));

  await writeFile(OUTPUT_PATH, `${JSON.stringify(airports, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        source: "OurAirports airports.csv",
        license: "Public Domain",
        output: OUTPUT_PATH,
        retainedAirports: airports.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
