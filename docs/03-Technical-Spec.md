# Technical Specification — Optimized Flight Search

**Version:** 1.4  
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
   │  ├── calls SerpApi Google Flights API (server-side only)
   │  ├── normalizes itineraries into the internal contract
   │  └── returns normalized JSON
   ▼
SerpApi (Google Flights API)
```

**Design principle:** the server returns **normalized but unscored itineraries**. All valid results are scored in the browser so that changing a preference weight reorders the list without a SerpApi round trip (< 300 ms requirement). Weight changes must **never** trigger a new SerpApi search.

The UI and scoring engine must **never** depend directly on SerpApi response shapes. Raw SerpApi responses are normalized server-side into the internal FlightScore contract before reaching the client.

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
| Airport autocomplete | **Local/static airport dataset** bundled with the app | Independent of SerpApi; sufficient for MVP |
| Flight data | **SerpApi using the Google Flights API** behind a provider abstraction | Selected MVP provider; replaceable later |

### SerpApi provider policy

The MVP flight-data provider is **SerpApi using the Google Flights API**.

Requirements:

- All SerpApi requests are made **server-side only**.
- The SerpApi API key must remain in server-side environment variables and must never appear in client code, browser requests, public logs, or the repository.
- Raw SerpApi response objects must **never** be passed directly to the UI or scoring engine.
- SerpApi responses must be normalized into the internal FlightScore itinerary contract before leaving the server.
- Provider-specific authentication, request construction, and response parsing must remain isolated in `lib/provider/`.
- Changing the provider later must not require modifications to the scoring engine or UI.
- SerpApi is the MVP provider choice; it is **not** a permanent architectural dependency.
- Airport autocomplete remains on the local/static dataset and must not call SerpApi.

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
      "dealReference": "opaque-provider-reference"
    }
  ]
}
```

`inbound` uses the same structure as `outbound` and is `null` for one-way searches.

**Field notes:**

- `searchId` — generated per request for **internal tracing/logging only**; not used by the client for business logic.
- `dealReference` — opaque provider-neutral reference for lazy server-side deal resolution. **Not a booking URL.** The client may hold it in memory to call `POST /api/deal`, but must not render it in the DOM, URLs, tooltips, or logs.
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

The server **must never propagate the raw SerpApi error body or raw SerpApi payload to the client**.

---

### `POST /api/deal`

Resolves a selected itinerary's opaque `dealReference` into a safe external HTTPS booking destination. FlightScore remains a search/rank/redirect product: booking completion happens on the airline or OTA site.

**Request:**

```json
{
  "dealReference": "opaque-provider-reference"
}
```

The token must be sent in the POST body only. Never place it in URL query strings.

**200 response:**

```json
{
  "redirectUrl": "https://airline.example/book",
  "sellerName": "Example Air"
}
```

The response must not include raw provider payloads, booking tokens, `post_data`, or Google click-tracker internals.

**Errors:**

| Code | HTTP | Situation |
|---|---|---|
| `INVALID_INPUT` | 400 | Missing or malformed `dealReference` |
| `DEAL_UNAVAILABLE` | 404 | No resolvable booking options, separate-ticket-only itinerary, or redirect could not be validated |
| `DEAL_EXPIRED` | 410 | Booking token no longer valid |
| `QUOTA_EXCEEDED` | 429 | Provider quota exhausted |
| `PROVIDER_ERROR` | 502 | Provider failure |
| `TIMEOUT` | 504 | Provider or redirect timeout |
| `INTERNAL_ERROR` | 500 | Unexpected server failure |

**Booking-option selection policy (MVP):**

1. Lowest effective EUR price first (`local_prices` EUR, else option price).
2. If tied, prefer airline-direct (`airline: true`).
3. If still tied, stable alphabetical `book_with`.

**Redirect resolution:** after POST/GET to the validated Google booking URL, the server follows HTTP redirect hops and validated HTML `meta refresh` targets. Some OTAs respond with HTTP 403 to server-side clients while still exposing a valid HTTPS landing URL; those destinations are accepted when URL validation passes.

**Cost control:** a View deal click triggers at most one SerpApi booking-options lookup on cache miss. Search, scoring, presets, sliders, and Show more trigger zero booking-option calls.

**Rate limiting:** application-level per-IP limits protect SerpApi quota:
- `POST /api/search`: **10 requests / IP / 10 minutes**
- `POST /api/deal`: **20 requests / IP / 10 minutes**

Blocked requests return HTTP **429** with `{ "error": "RATE_LIMITED" }`. Rate limiting is enforced in `lib/rate-limit.ts` before provider/deal work begins. IP identifiers are hashed before storage.

**Vercel WAF (pre-launch):** before public launch, also configure Vercel Firewall/WAF rate-limit rules for `/api/search` and `/api/deal` as defense-in-depth. Application-level limiting remains the source of precise API error behavior.

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

**Deal resolution cache:** successful View deal resolutions are cached separately in `lib/deal/cache.ts` for 5 minutes, keyed by a cryptographic hash of `dealReference`. Only `{ redirectUrl, sellerName }` is stored.

**Deal search-context cache:** when `/api/search` returns itineraries, the server registers each non-null `dealReference` in `lib/deal/context-cache.ts` with the originating route context (`origin`, `destination`, `departureDate`, optional `returnDate`). SerpApi booking-options lookups require this context in addition to the opaque token. TTL matches the search cache (`CACHE_TTL_SECONDS`). If context is missing, the server may fall back to parsing embedded segment data from one-way booking tokens before failing with `DEAL_UNAVAILABLE`.

**Backend selection:**
- **Production (`VERCEL_ENV=production`):** Upstash Redis REST is required (`KV_REST_API_URL` + `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`). Missing credentials fail safely; no silent in-memory fallback.
- **Preview, local development, and tests:** in-memory backends when Redis env vars are absent.
- **When Redis env vars are present:** Redis is used regardless of environment.

**Redis key namespaces (safe payloads only):**
- `flightscore:search:…`
- `flightscore:deal-context:…` (hashed `dealReference`)
- `flightscore:deal-resolution:…` (hashed `dealReference`)

No raw SerpApi payloads, API keys, or booking tokens are stored in Redis.

---

## 5. Currency

- All prices returned to the client are **EUR**.
- Request **EUR directly from SerpApi / Google Flights** whenever the API supports it.
- If SerpApi supports its own currency conversion, **use that conversion**.
- Do **not** add a separate FX service during the MVP unless SerpApi makes it necessary.
- Any SerpApi-specific conversion logic stays in **`lib/normalize.ts`** or the SerpApi provider adapter.

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

FlightScore uses bundled local airport metadata for normalization and a separate smaller autocomplete index for the UI.

**Normalization dataset (`src/data/airports.json`):**

- Source: [OurAirports](https://ourairports.com/data/) `airports.csv` (Public Domain)
- Retained entries: airports with a valid 3-character IATA code (approximately 8,000–9,000 records)
- Fields: `iata`, `name`, `city`, `countryCode`, `latitude`, `longitude`, `timeZone` (IANA ID derived offline from coordinates)
- Lookup: `lib/airport-metadata.ts` (local/offline, no runtime network calls)

**Autocomplete dataset (`src/data/airports-autocomplete.json`):**

- Small curated subset for MVP search-form autocomplete
- Full commercial-airport indexing can replace this later without changing normalization

Maintain an explicit **Schengen member country-code set in code** (e.g. `lib/schengen.ts`). Determine an airport’s Schengen status from its `countryCode`.

---

## 8. Modules and responsibilities

Suggested logical structure (exact filenames may adapt to standard Next.js conventions):

| Module | Responsibility | Must not do |
|---|---|---|
| `app/api/search/route.ts` | HTTP entry point, validation, orchestration | Scoring logic |
| `app/api/deal/route.ts` | Lazy deal resolution and safe external redirect lookup | Scoring; booking completion |
| `lib/provider/index.ts` | Provider interface and SerpApi implementation wiring | UI logic |
| `lib/provider/serpapi/*` | SerpApi authentication, Google Flights search, booking-options lookup, redirect resolution | Scoring; must not expose raw responses to UI |
| `lib/deal/*` | Deal validation, booking-option selection, redirect safety, deal cache | UI logic |
| `lib/normalize.ts` | Convert SerpApi responses into the internal contract; EUR normalization; layover and `connectionType` derivation | Make unrelated network calls; must not pass raw SerpApi shapes to callers |
| `lib/cache.ts` | Get/set with TTL using the cache key contract | Know UI behavior |
| `lib/scoring.ts` | Normalization, weighting, penalties, sorting, top-5 risky prioritization | Make network calls or manipulate UI |
| `lib/schengen.ts` | Explicit Schengen country-code set and lookup helpers | UI logic |
| `lib/airport-metadata.ts` / `data/airports.json` | Comprehensive offline airport metadata for normalization | Call SerpApi |
| `lib/airports.ts` / `data/airports-autocomplete.json` | Autocomplete helpers for the search UI | Own normalization rules |
| `components/*` | Search form, preference controls, result cards | Own business rules |

**Rule:** replacing SerpApi should require changes only inside `lib/provider/` and, where SerpApi response shape requires it, `lib/normalize.ts`.

---

## 9. Security

- SerpApi credentials live **only** in server-side environment variables. Never expose them in the browser bundle or repository.
- The repository includes `.env.example` with variable names and no secret values.
- `/api/search` validates and sanitizes all input before use.
- `/api/deal` validates opaque `dealReference` input, resolves booking options server-side only, validates every redirect hop, and returns only safe external HTTPS destinations.
- Redirect safety: HTTPS-only destinations, DNS-aware SSRF checks, blocked private/internal/metadata addresses, and no client-supplied destination URLs.
- **Rate limiting is active:** `POST /api/search` allows 10 requests per IP per 10 minutes; `POST /api/deal` allows 20 requests per IP per 10 minutes. Excess requests return HTTP 429 `RATE_LIMITED`.
- Use same-origin server routes; do not expose SerpApi credentials through CORS or client requests.
- No cookies or storage of personal data in the MVP.
- Add hard controls / alerts around SerpApi quota to prevent unexpected spending.

**Environment variables (MVP baseline):**

```text
SERPAPI_API_KEY
SERPAPI_ENGINE=google_flights
CACHE_TTL_SECONDS
```

Additional SerpApi or application variables may be required. They must remain server-side and be documented in `.env.example`.

---

## 10. Performance

| Requirement | Target |
|---|---|
| Complete search (p95) | < 5 s |
| Score recalculation after moving a weight | < 300 ms, no SerpApi request |
| Initial bundle | Keep as small as practical; avoid unnecessary dependencies |
| Results processed in browser | Score all valid returned itineraries; up to 200 without perceptible degradation |
| Results rendered initially | First 30; **Show more** reveals additional already-scored results |

Recalculation must operate on data already held in memory. If UI input becomes noticeably expensive, apply a small debounce (e.g. 50 ms) to preference controls without introducing SerpApi requests.

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
5. Unit tests for **`lib/scoring.ts`** and **`lib/normalize.ts`** (minimum: equal-value normalization, accumulated/stacked penalties, tie-breaking, top-5 risky prioritization edge cases, layover duration from timestamps, `connectionType` classification, EUR handling via SerpApi/provider conversion). Normalization tests must use fixtures or mock SerpApi responses; tests must not depend on live paid API calls.
6. Short note documenting technical decisions and known limitations.
