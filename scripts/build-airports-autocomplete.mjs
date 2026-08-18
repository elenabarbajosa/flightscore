/**
 * Builds src/data/airports-autocomplete.json from src/data/airports.json.
 *
 * Client-safe subset: iata, name, city, countryCode only.
 * Run: node scripts/build-airports-autocomplete.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const INPUT_PATH = resolve(process.cwd(), "src/data/airports.json");
const OUTPUT_PATH = resolve(process.cwd(), "src/data/airports-autocomplete.json");

async function main() {
  const airports = JSON.parse(await readFile(INPUT_PATH, "utf8"));

  const autocompleteAirports = airports.map(({ iata, name, city, countryCode }) => ({
    iata,
    name,
    city,
    countryCode,
  }));

  await writeFile(OUTPUT_PATH, `${JSON.stringify(autocompleteAirports)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        source: INPUT_PATH,
        output: OUTPUT_PATH,
        airportCount: autocompleteAirports.length,
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
