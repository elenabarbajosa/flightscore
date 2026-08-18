# FlightScore — Project Instructions

## Source of truth

Before implementing any feature, read the relevant documentation in /docs.

Priority:
1. docs/01-PRD.md
2. docs/02-Functional-Spec.md
3. docs/03-Technical-Spec.md
4. docs/04-Delivery-Backlog.md

Do not invent features outside the MVP.

## Product language

- The MVP is **English only**.
- All user-facing UI text must be written in natural English.
- Code, variable names, types, tests, technical documentation, comments, and repository conventions must be in English.
- Do not add localization or internationalization infrastructure during the MVP.

## Technology

- Next.js (App Router)
- React
- TypeScript
- **Tailwind CSS**
- Mobile-first responsive design
- Server-side flight API access
- Vercel-compatible architecture
- **No database** unless explicitly required later
- **No authentication** or user accounts in the MVP

## Architecture rules

- API credentials must never appear in client-side code.
- Flight provider logic must remain isolated behind a **provider abstraction**.
- The server returns **normalized, unscored** itineraries.
- **Flight scoring happens client-side.** Score all valid returned results in the browser.
- Moving Price, Stops, or Duration controls must **not** trigger a new provider API request.
- Maximum **2 stops per journey direction** (outbound and inbound evaluated separately).
- Do not modify the v1 scoring formula unless explicitly instructed.
- Keep provider-specific implementation separate from scoring and UI.
- Cache access is abstracted in **`lib/cache.ts`**; start with the simplest viable implementation.
- One-way cache keys use the literal sentinel **`"ONE_WAY"`** for missing `returnDate`.
- Airport autocomplete uses a **local/static dataset** (not the paid flight provider).
- **`searchId`** is for internal request tracing only.

## Scoring and ranking

- Scoring inputs for round trips: total price, outbound + inbound duration, total stops across both directions.
- Airport-change penalties **stack** with risky-connection penalties when both apply.
- With **Show tight connections** disabled (default):
  - Non-risky itineraries fill positions **1–5** first.
  - If fewer than five non-risky itineraries exist, fill remaining positions 1–5 with risky itineraries in score order.
  - Append remaining itineraries from position 6 onward in score order.
  - Never leave ranking positions empty when results exist.
- With **Show tight connections** enabled: use normal score ordering for all itineraries; penalties still apply.
- Render the first **30** scored results; **Show more** reveals additional already-scored results.
- A **valid itinerary** is successfully normalized, scoring-complete, within the 2-stops-per-direction rule, and rankable. Risky itineraries remain valid.

## Connection and display rules

- Layover `connectionType`: `"DOMESTIC" | "SCHENGEN" | "INTERNATIONAL"`.
- Maintain an explicit **Schengen country-code set in code**; determine Schengen status from airport `countryCode`.
- Layover durations use timezone-aware ISO timestamps (elapsed time).
- Display **`operatingCarrier`** as primary; fall back to **`marketingCarrier`** when missing; when both differ, show **`operatingCarrier`**.

## Currency

- Request **EUR** directly from the provider whenever supported.
- If the provider supports its own currency conversion, use that.
- Do **not** add a separate FX service during the MVP unless the selected provider makes it necessary.

## MVP scope

### Included

- Search form with static airport autocomplete
- Flight search via server-side provider abstraction
- Client-side scoring with weights, presets, score breakdown, and **Show tight connections** toggle
- Results list with outbound booking links
- Tailwind CSS, mobile-first responsive UI
- Per-IP rate limiting before final delivery (may be implemented in F4)

### Excluded

- No user accounts or authentication
- No payments
- No bookings inside the application (redirect to airline or OTA)
- No flexible dates
- No price alerts
- No multi-city
- No hotel, car, or insurance functionality
- No localization
- **No PWA**
- No native iOS or Android app
- No separate FX service unless required by the selected provider

## Development rules

- Follow the backlog in docs/04-Delivery-Backlog.md; implement one clearly defined task at a time.
- The flight-data provider is selected during **F0 provider evaluation**.
- Do not make large unsolicited refactors.
- Do not add unnecessary dependencies.
- Prefer simple solutions over premature abstraction.
- Keep components small and typed.
- Use standard Next.js conventions.
- Add unit tests for **scoring** (`lib/scoring.ts`) and **normalization** (`lib/normalize.ts`).
- Run lint, typecheck, and tests before considering a task complete.

## Design direction

The product should feel:
- premium
- minimal
- trustworthy
- information-dense
- modern but restrained

Avoid:
- generic AI/SaaS dashboard styling
- excessive gradients
- huge rounded cards
- excessive shadows
- oversized typography
- unnecessary decorative elements

Prioritize:
- clear visual hierarchy
- strong typography
- compact flight information
- clear pricing
- readable route information
- subtle score/risk indicators

## Git and commits

- Use Conventional Commits for all Git commits.
- Format: `<type>(optional scope): <description>`
- Use lowercase imperative descriptions.
- Keep commits focused and atomic.
- Do not combine unrelated changes in one commit.
- Preferred types: feat, fix, docs, test, refactor, style, chore, perf, ci.