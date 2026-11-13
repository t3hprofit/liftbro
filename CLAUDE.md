# LiftBro

Gym workout tracking PWA. Goal: eventually sellable / ad-supported; current
version just needs to work.

## Product

- Log sets with reps and weight per exercise; multiple exercises per workout
- History view (duration, set count, total volume; shows plan name if any)
- Plans: reusable templates (name + ordered exercises with sets × reps
  targets). Ships with Push/Pull/Legs + Upper/Lower starters, all editable.
  Starting from a plan pre-loads exercises; logger shows "2/4 sets" progress
  and pre-fills target reps. Exercises with zero sets are dropped on finish.
- Planned next: TBD — scope is being fleshed out iteratively with the owner
  (ideas: weekly schedule, target weights / progression, planned-vs-actual
  in history)
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
  `src/lib/storage.ts`. `loadStore` seeds starter plans only when the saved
  data has no `plans` key (an empty array means the user deleted them); persistence + React binding live in
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
