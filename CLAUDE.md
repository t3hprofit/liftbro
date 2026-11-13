# LiftBro

Gym workout tracking PWA. Goal: eventually sellable / ad-supported; current
version just needs to work.

## Product

- Log sets with reps and weight per exercise; multiple exercises per workout
- History view (duration, set count, total volume; shows plan name if any)
- Plans: reusable templates (name + ordered exercises with sets × reps
  targets), all editable. Built-in library (`PROGRAM_LIBRARY` in storage.ts):
  Full Body, Push/Pull/Legs, Upper/Lower, GZCLP, Arnold Split, each with a
  level badge + blurb. Plans page → LIBRARY re-adds deleted ones. Pull Day
  uses Lat Pulldown, not Pull-Up (owner request).
- Today: "Next up" suggests the day after the last finished plan within its
  program (wraps); plans listed grouped by program; Freestyle for a blank one.
- Logger: "2/4 sets · target 4 × 6" per planned exercise; reps pre-filled
  from target, weight pre-filled from last time ("Last time: 135×10, …").
  Exercises with zero sets are dropped on finish.
- Target audience includes the owner's wife, who is new to lifting and to
  apps: favour fewer decisions, pre-filled values, plain-English labels.
- Planned next: TBD (ideas: weekly schedule, target weights / progression,
  planned-vs-actual in history, rest timer)
- Look & feel: "gym bro" vibe — dark iron/steel, blood-red accent, Anton
  display font, uppercase headings. Explicitly NOT Planet Fitness purple/yellow.

## Stack

Mirrors ClearInspect's frontend (`D:\code\ttw\ClearInspect\web`), minus server
bits: Next.js 16 **static export** (`output: "export"`) · TypeScript · Tailwind
CSS 4 · shadcn/ui on Base UI · lucide-react · Vitest. No backend yet — data is
localStorage only (`src/lib/storage.ts`, versioned key `liftbro.v1`). No Azure
yet (deliberate, owner decision Nov 2026).

## Commands

- `npm run dev` — dev server on port 3200
- `npm test` / `npm run lint` / `npm run build` (exports to `out/`)
- `npm run icons` — regenerate PWA icons (`scripts/generate-icons.mjs`, no
  image deps — hand-encoded PNG)

## Architecture notes

- All storage mutations are pure functions (Store in → Store out) in
  `src/lib/storage.ts`. Library seeding is versioned: `LIBRARY_VERSION` +
  `Program.since`; `loadStore` → `syncLibrary` adds only programs newer than
  the store's `libraryVersion`, skipping plan names already present, so
  deletions stick. Bump `LIBRARY_VERSION` when adding a program; persistence + React binding live in
  `src/hooks/use-workout-store.ts` via `useSyncExternalStore` (server snapshot
  is null so static HTML hydrates cleanly).
- PWA: `src/app/manifest.ts` + `public/sw.js` (network-first navigations,
  cache-first assets). No blocking browser dialogs anywhere — destructive
  actions use the two-tap `ConfirmButton`.
- Pages are client components; keep everything statically exportable (no
  server actions, no dynamic routes) or the GitHub Pages deploy breaks.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` (push to `main`: lint → test →
build → deploy). Custom domain `liftbro.app` — GoDaddy DNS already points at
GitHub Pages; repo Settings → Pages needs Source = GitHub Actions + custom
domain + Enforce HTTPS on first setup. `.app` requires HTTPS to resolve.

## Name & domains

Product name **LiftBro**. Domains (GoDaddy, Nov 2026): `liftbro.ai` (primary),
`liftbro.app` (web app, deploy target), `liftbro.fit` (defensive).

## Working with the owner

- Solo hobby project; keep decisions pragmatic, avoid over-engineering.
- Flesh out requirements conversationally before building big pieces.
