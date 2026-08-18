# FlightScore — Project Instructions

## Source of truth

Before implementing any feature, read the relevant documentation in `/docs`.

Priority:

1. `docs/01-PRD.md`
2. `docs/02-Functional-Spec.md`
3. `docs/03-Technical-Spec.md`
4. `docs/04-Delivery-Backlog.md`

Do not invent features outside the MVP.

## Product language

* The MVP is **English only**.
* All user-facing UI text must be written in natural English.
* Code, variable names, types, tests, technical documentation, comments, and repository conventions must be in English.
* Do not add localization or internationalization infrastructure during the MVP.

## Technology

* Next.js (App Router)
* React
* TypeScript
* **Tailwind CSS**
* Mobile-first responsive design
* Server-side flight API access
* Vercel-compatible architecture
* **No database** unless explicitly required later
* **No authentication** or user accounts in the MVP

## Flight data provider

* The selected MVP flight-data provider is **SerpApi using the Google Flights API**.
* SerpApi is used as FlightScore's external flight-search data source.
* FlightScore is a **search and ranking engine**, not a flight-booking platform.
* FlightScore does **not** sell, issue, manage, or service airline tickets.
* FlightScore does **not** process flight bookings or flight payments.
* Users are redirected to the relevant airline or OTA to complete their booking.
* All SerpApi requests must be made **server-side**.
* The SerpApi API key must never appear in client-side code, browser requests, public logs, or the repository.
* Raw SerpApi response objects must never be passed directly to the UI or scoring engine.
* SerpApi responses must first be normalized into the internal FlightScore itinerary contract.
* Provider-specific implementation must remain isolated behind the **provider abstraction**.
* Do not couple UI components, scoring logic, business rules, or application-wide types directly to SerpApi-specific response structures.
* The architecture must remain replaceable so SerpApi can be swapped for another flight-data provider later without redesigning the application.
* Selecting SerpApi for the MVP does **not** make SerpApi a permanent architectural dependency.

## Architecture rules

* API credentials must never appear in client-side code.
* Flight provider logic must remain isolated behind a **provider abstraction**.
* The server returns **normalized, unscored** itineraries.
* **Flight scoring happens client-side.** Score all valid returned results in the browser.
* Moving Price, Stops, or Duration controls must **not** trigger a new SerpApi request.
* Maximum **2 stops per journey direction**; outbound and inbound are evaluated separately.
* Do not modify the v1 scoring formula unless explicitly instructed.
* Keep provider-specific implementation separate from scoring and UI.
* Cache access is abstracted in **`lib/cache.ts`**; start with the simplest viable implementation.
* One-way cache keys use the literal sentinel **`"ONE_WAY"`** for missing `returnDate`.
* Airport autocomplete uses a **local/static dataset**, not SerpApi.
* **`searchId`** is for internal request tracing only.
* The internal normalized FlightScore itinerary contract is the application-wide source of truth for flight data after provider normalization.

## Scoring and ranking

* Scoring inputs for round trips:

  * total round-trip price
  * outbound duration + inbound duration
  * total stops across both directions
* The maximum 2-stop rule continues to apply separately to outbound and inbound journeys.
* Airport-change penalties **stack** with risky-connection penalties when both apply.
* With **Show tight connections** disabled by default:

  * Non-risky itineraries fill positions **1–5** first.
  * If fewer than five non-risky itineraries exist, fill the remaining positions 1–5 with risky itineraries in score order.
  * Append remaining itineraries from position 6 onward in score order.
  * Never leave ranking positions empty when results exist.
* With **Show tight connections** enabled:

  * Use normal score ordering for all itineraries.
  * All applicable penalties still apply.
* Render the first **30** scored results.
* **Show more** reveals additional already-scored results without another provider request.
* A **valid itinerary** is:

  * successfully normalized
  * complete enough to calculate all required scoring inputs
  * within the maximum 2 stops per direction rule
  * eligible to be ranked
* Risky itineraries remain valid itineraries.

## Connection and display rules

* Layover `connectionType`:

  * `"DOMESTIC"`
  * `"SCHENGEN"`
  * `"INTERNATIONAL"`
* Maintain an explicit **Schengen country-code set in code**.
* Determine an airport's Schengen status from its `countryCode`.
* Layover durations must be calculated using timezone-aware ISO timestamps and actual elapsed time.
* Display **`operatingCarrier`** as the primary airline.
* If `operatingCarrier` is unavailable, fall back to **`marketingCarrier`**.
* If both exist and differ, the operating carrier remains the primary airline shown to the user.

## Currency

* Request **EUR** directly from SerpApi / Google Flights whenever the provider interface supports it.
* Prefer provider-returned EUR prices rather than adding a separate currency-conversion layer.
* If provider-specific currency normalization is required, perform it server-side before returning the normalized FlightScore contract.
* Do **not** add a separate FX service during the MVP unless it becomes technically necessary.

## MVP scope

### Included

* Search form with static airport autocomplete
* Flight search through the server-side SerpApi provider adapter
* Normalization of provider responses into the internal FlightScore contract
* Client-side scoring with:

  * adjustable Price, Stops, and Duration weights
  * presets
  * score breakdown
  * **Show tight connections** toggle
* Ranked flight results
* Outbound links that redirect users to the relevant airline or OTA to complete booking
* Tailwind CSS
* Mobile-first responsive UI
* Per-IP rate limiting before final MVP delivery; this may be implemented in F4

### Excluded

* No user accounts
* No authentication
* No personal-data persistence
* No payments
* No bookings inside FlightScore
* No ticket issuance
* No booking management
* No cancellation or refund handling
* No flexible dates
* No price alerts
* No multi-city
* No hotel, car, or insurance functionality
* No localization
* **No PWA**
* No native iOS or Android app
* No separate FX service unless technically required

## Development rules

* Follow the backlog in `docs/04-Delivery-Backlog.md`.
* Implement one clearly defined task at a time.
* The selected MVP flight-data provider is **SerpApi Google Flights API**.
* Do not reopen provider selection during normal F1 implementation unless a documented technical blocker makes SerpApi unsuitable.
* Do not make large unsolicited refactors.
* Do not add unnecessary dependencies.
* Prefer simple solutions over premature abstraction.
* Keep components small and typed.
* Use standard Next.js conventions.
* Add unit tests for:

  * **scoring** (`lib/scoring.ts`)
  * **normalization** (`lib/normalize.ts`)
* Provider normalization tests must use fixtures or mock SerpApi responses; tests must not depend on live paid API calls.
* Run lint, typecheck, and relevant tests before considering a task complete.
* Run a production build at meaningful phase boundaries.
* Do not expose secrets in logs, fixtures, screenshots, documentation, or commits.

## Design direction

The product should feel:

* premium
* minimal
* trustworthy
* information-dense
* modern but restrained

Avoid:

* generic AI/SaaS dashboard styling
* excessive gradients
* huge rounded cards
* excessive shadows
* oversized typography
* unnecessary decorative elements

Prioritize:

* clear visual hierarchy
* strong typography
* compact flight information
* clear pricing
* readable route information
* subtle score/risk indicators
* fast comparison between competing itineraries
* clear explanation of why a result ranks where it does

## Git and commits

* Use Conventional Commits for all Git commits.
* Format: `<type>(optional scope): <description>`
* Use lowercase imperative descriptions.
* Keep commits focused and atomic.
* Do not combine unrelated changes in one commit.
* Preferred types:

  * `feat`
  * `fix`
  * `docs`
  * `test`
  * `refactor`
  * `style`
  * `chore`
  * `perf`
  * `ci`
* Do not commit secrets or `.env.local`.
* Do not automatically push unless explicitly instructed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
