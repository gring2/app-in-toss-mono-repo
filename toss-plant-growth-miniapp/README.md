# Plant Growth Diary Miniapp (React Native)

This project is a Granite-based React Native miniapp configured for Apps-in-Toss.

## Team workflow

Agent-based delivery workflow lives at [`../AGENTS.md`](../AGENTS.md).

## Included features

- Local-only plant growth records (no backend)
- Multiple plants with slot unlock
- First photo baseline + latest photo automatic comparison
- First-day dedicated UX (no duplicated before/after compare)
- Home hero with `첫날 vs 오늘` slider
- Camera capture flow for baseline and daily photos
- Post-capture short interstitial ad (max once per day)
- Timeline viewer for each plant (`/timeline`)
- Timeline-end ad removed for smoother content completion
- Rewarded ad gate for HD export on compare screen

## Run locally

```bash
npm install
npm run dev
```

## Build `.ait` bundle

```bash
npm run build
```

## Open in Toss sandbox

Use this scheme in the sandbox app:

```text
intoss://toss-todo-miniapp
```

## Before real console registration

Update these values in `granite.config.ts` to match your Apps-in-Toss console app:

- `appName`
- `brand.displayName`
- `brand.icon`
- adGroupId values in:
  - `src/pages/compare.tsx` (HD save reward ad)
  - `src/pages/index.tsx` (new plant slot unlock ad)
  - `src/pages/capture.tsx` (post-capture interstitial ad)

## Data policy in MVP

- All records are stored in local miniapp storage (`plant-growth-v2`)
- Same-day photos are overwritten per plant (1 photo per day per plant)
- Data does not sync between devices
- Reinstall/device change recovery is not supported in this version
