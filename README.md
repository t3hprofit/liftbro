# LiftBro

> Your bro for the barbell. Track lifts, crush plans, log gains.

Gym workout tracker PWA. Log sets, reps, and weight — no fluff. Live at
[liftbro.app](https://liftbro.app). Data lives in your browser's localStorage
for now; a database backend comes later.

## Features

- **Workout logging** — record sets, reps, and weight per exercise
- **Multiple exercises** — free-text names with suggestions from a seed library
  plus everything you've logged before
- **History** — past sessions with duration, set count, and total volume
- Planned next: daily plans (planned vs. actual), more TBD

## Stack

Next.js 16 (static export) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) ·
Vitest. Mirrors the ClearInspect frontend stack, minus the server bits — GitHub
Pages only serves static files.

## Development

```bash
npm install
npm run dev        # http://localhost:3200
npm test           # vitest
npm run lint
npm run build      # static export to out/
npm run icons      # regenerate PWA icons in public/
```

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`. GoDaddy DNS for `liftbro.app` already points at
GitHub Pages.

One-time setup after creating the GitHub repo:

1. Repo **Settings → Pages → Source**: select **GitHub Actions**.
2. Repo **Settings → Pages → Custom domain**: enter `liftbro.app`, then check
   **Enforce HTTPS** once the cert is issued (required — `.app` only resolves
   over HTTPS).

## Domains

- [liftbro.ai](https://liftbro.ai) — primary
- [liftbro.app](https://liftbro.app) — web app (this repo deploys here)
- [liftbro.fit](https://liftbro.fit) — defensive

## Notes

- PWA: `src/app/manifest.ts` + `public/sw.js` (app-shell cache, offline-capable
  after first visit). Install from the browser menu → "Add to Home Screen".
- Data model and all storage logic: `src/lib/storage.ts` (versioned,
  `liftbro.v1` key).
