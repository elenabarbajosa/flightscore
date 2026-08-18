# Technical Specification — Optimized Flight Search

**Version:** 1.3  
**Date:** August 18, 2026  
**Associated documents:** 01-PRD.md, 02-Functional-Spec.md

---

## 1. Architecture

```text
Browser
   │
   │  Next.js web application
   │  ├── scoring (all valid results)
   │  └── renders first 30; Show more for remainder
   │
   │  POST /api/search
   ▼
Next.js server-side route / server function
   │  ├── validates input
   │  ├── checks cache (lib/cache.ts)
   │  ├── calls the selected flight-data provider
   │  ├── normalizes itineraries (incl. EUR, layovers, connectionType)
   │  └── returns normalized JSON
   ▼
Flight-data provider
```

**Design principle:** the server returns **normalized but unscored itineraries**. All valid results are scored in the browser so that changing a preference weight reorders the list without a network round trip (< 300 ms requirement).

The product is a responsive **web app** built with Next.js. It must work well as a conventional website in the browser. **PWA support and native iOS or Android applications are outside the MVP.**

---

## 2. Technology stack

| Layer | Technology | Rationale |
|---|---|---|
| Application framework | Next.js (App Router) + React | One codebase for public web UI, interactive app behavior, and server-side endpoints |
| Language | TypeScript | Shared types across UI, scoring, API contracts, and server code |
| Styling | **Tailwind CSS** | Mobile-first styling with a maintainable utility-first approach |
| Server | Next.js route handlers / server-side functions on Node.js 20+ | No separately managed server required |
| Hosting | Vercel (preferred for MVP) | Direct Next.js support, Git deployment, free tier suitable for early validation |
| Cache | **`lib/cache.ts` abstraction**; start with the simplest viable implementation | Avoid premature infrastructure; swap backing store without changing callers |
| Airport autocomplete | **Local/static airport dataset** bundled with the app | Avoid paid provider usage for lookup; sufficient for MVP |
| Flight data | **Provider selected during implementation** behind a provider abstraction | Avoid hard dependency on a single supplier |

### Flight-data provider policy

No provider is a permanent architectural dependency.

The initial provider should be selected based on:

- access for a small MVP,
- current pricing / free allowance,
- coverage of long-haul routes,
- quality and completeness of itinerary data,
- availability of prices and outbound booking links,
- ability to request or return EUR pricing,
- implementation complexity.

All provider-specific authentication, request construction, and response parsing must remain isolated. Changing the provider must not require modifications to the scoring engine or UI.

---

## 3. Internal API contract

### `POST /api/search`

**Request:**

```json
{
  "origin": "LIS",
  "destination": "NRT",
  "departureDate": "2026-11-14",
  "returnDate": "2026-11-28",
  "passengers": 2,
  "cabinClass": "ECONOMY"
}
```

**200 response:**

```json
{
  "currency": "EUR",
  "searchId": "abc123",
  "cached": false,
  "results": [
    {
      "id": "itin_001",
      "price": 842.50,
      "totalDurationMinutes": 1065,
      "stopCount": 1,
      "outbound": {
        "departureTime": "2026-11-14T10:25:00+00:00",
        "arrivalTime": "2026-11-15T14:10:00+09:00",
        "durationMinutes": 1065,
        "segments": [
          {
            "operatingCarrier": "AF",
            "marketingCarrier": "AF",
            "flightNumber": "1025",
            "from": "LIS",
            "to": "CDG",
            "departureTime": "2026-11-14T10:25:00+00:00",
            "arrivalTime": "2026-11-14T14:05:00+01:00",
            "durationMinutes": 160
          }
        ],
        "layovers": [
          {
            "airport": "CDG",
            "durationMinutes": 95,
            "airportChange": false,
            "connectionType": "INTERNATIONAL"
          }
        ]
      },
      "inbound": null,
      "deepLink": "https://..."
    }
  ]
}
```

`inbound` uses the same structure as `outbound` and is `null` for one-way searches.

**Field notes:**

- `searchId` — generated per request for **internal tracing/logging only**; not used by the client for business logic.
- `connectionType` — `"DOMESTIC" | "SCHENGEN" | "INTERNATIONAL"`; see functional spec section 6.
- Segment carriers — UI displays **`operatingCarrier`** as the primary airline. If `operatingCarrier` is missing, fall back to `marketingCarrier`. When both exist and differ, display `operatingCarrier`.
- Layover `durationMinutes` — computed server-side from timezone-aware ISO timestamps as elapsed time between segment arrival and next departure.

**Errors:**

| Code | Situation | Body |
|---|---|---|
| 400 | Invalid input | `{ "error": "INVALID_INPUT", "field": "departureDate" }` |
| 429 | Provider or application quota exhausted | `{ "error": "QUOTA_EXCEEDED" }` |
| 502 | Provider failure | `{ "error": "PROVIDER_ERROR" }` |
| 504 | Timeout (> 15 s) | `{ "error": "TIMEOUT" }` |

The server **must never propagate the raw provider error body to the client**.

---

## 4. Cache

All cache access goes through **`lib/cache.ts`**. Callers pass a structured key; the module handles TTL and storage.

**Cache key components (all required):**

- `origin`
- `destination`
- `departureDate`
- `returnDate` — use the literal sentinel **`"ONE_WAY"`** when absent (one-way searches)
- `passengers`
- `cabinClass`

**TTL:** 30 minutes (configurable via `CACHE_TTL_SECONDS`).

**Initial implementation:** use the simplest viable backing store behind the abstraction (e.g. in-process memory). Upgrade the implementation later without changing route handlers or key structure.

---

## 5. Currency

- All prices returned to the client are **EUR**.
- Request **EUR directly from the provider** whenever the API supports it.
- If the provider supports its own currency conversion, **use that conversion**.
- Do **not** add a separate FX service during the MVP unless the selected provider makes it necessary.
- Any provider-specific conversion logic stays in **`lib/normalize.ts`** or the provider adapter.

---

## 6. Valid itineraries

An itinerary is **valid** when it is:

1. Successfully normalized into the internal contract.
2. Complete with all fields required for scoring.
3. Within the maximum **2 stops per direction** rule.
4. Able to be scored and ranked.

Risky itineraries remain valid. Invalid itineraries are excluded before scoring.

---

## 7. Static airport dataset

Bundled local/static dataset for autocomplete and connection classification.

**Minimum fields:** `iata`, `name`, `city`, `countryCode`, `latitude`, `longitude`.

Maintain an explicit **Schengen member country-code set in code** (e.g. `lib/schengen.ts`). Determine an airport’s Schengen status from its `countryCode`.

---

## 8. Modules and responsibilities

Suggested logical structure (exact filenames may adapt to standard Next.js conventions):

| Module | Responsibility | Must not do |
|---|---|---|
| `app/api/search/route.ts` | HTTP entry point, validation, orchestration | Scoring logic |
| `lib/provider/index.ts` | Provider interface and selected implementation wiring | UI logic |
| `lib/provider/<provider>.ts` | Provider authentication and network calls | Scoring |
| `lib/normalize.ts` | Convert provider response into the internal contract; EUR normalization; layover and `connectionType` derivation | Make unrelated network calls |
| `lib/cache.ts` | Get/set with TTL using the cache key contract | Know UI behavior |
| `lib/scoring.ts` | Normalization, weighting, penalties, sorting, top-5 risky prioritization | Make network calls or manipulate UI |
| `lib/schengen.ts` | Explicit Schengen country-code set and lookup helpers | UI logic |
| `lib/airports.ts` (or `data/airports.json`) | Static airport dataset and lookup helpers for autocomplete | Call paid provider APIs |
| `components/*` | Search form, preference controls, result cards | Own business rules |

**Rule:** changing flight-data provider should require changes only inside `lib/provider/` and, where provider response shape requires it, `lib/normalize.ts`.

---

## 9. Security

- Provider credentials live **only** in server-side environment variables. Never expose them in the browser bundle or repository.
- The repository includes `.env.example` with variable names and no secret values.
- `/api/search` validates and sanitizes all input before use.
- **Rate limiting is an MVP security requirement:** 30 searches per IP / 10 minutes. May be implemented during **F4** but must be present before final delivery.
- Use same-origin server routes; do not expose provider credentials through CORS or client requests.
- No cookies or storage of personal data in the MVP.
- Add hard controls / alerts around upstream API quota to prevent unexpected spending.

**Environment variables (provider-agnostic baseline):**

```text
FLIGHT_PROVIDER
FLIGHT_API_KEY
FLIGHT_API_SECRET
FLIGHT_API_BASE_URL
CACHE_TTL_SECONDS
```

The selected provider may require additional variables. They must remain server-side and be documented in `.env.example`.

---

## 10. Performance

| Requirement | Target |
|---|---|
| Complete search (p95) | < 5 s |
| Score recalculation after moving a weight | < 300 ms, no network request |
| Initial bundle | Keep as small as practical; avoid unnecessary dependencies |
| Results processed in browser | Score all valid returned itineraries; up to 200 without perceptible degradation |
| Results rendered initially | First 30; **Show more** reveals additional already-scored results |

Recalculation must operate on data already held in memory. If UI input becomes noticeably expensive, apply a small debounce (e.g. 50 ms) to preference controls without introducing network requests.

---

## 11. Compatibility and language

- Browsers: latest two versions of Chrome, Safari, Firefox, and Edge.
- Mobile: iOS Safari and Chrome on Android, from 375 px width.
- Design priority: mobile first.
- MVP language: **English only**.
- Code, identifiers, tests, technical documentation, user-facing copy, and repository conventions should be written in English.
- Do not add localization / internationalization infrastructure during the MVP.

---

## 12. Technical deliverables

1. Git repository with clear commit history.
2. `README.md` with requirements, local installation, environment variables, development commands, and deployment instructions.
3. `.env.example`.
4. Deployed application accessible by URL.
5. Unit tests for **`lib/scoring.ts`** and **`lib/normalize.ts`** (minimum: equal-value normalization, accumulated/stacked penalties, tie-breaking, top-5 risky prioritization edge cases, layover duration from timestamps, `connectionType` classification, EUR handling via provider conversion).
6. Short note documenting technical decisions and known limitations.
