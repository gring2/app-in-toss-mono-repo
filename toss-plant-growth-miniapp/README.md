# 오늘의 식물일기 Miniapp (React Native)

This project is a Granite-based React Native miniapp configured for Apps-in-Toss.

## SDK baseline

- Apps-in-Toss framework: `2.0.1`
- React / React Native: `19.2.3` / `0.84.0`
- Build command: `ait build`

## Custom subagent workflow

Project-scoped Codex custom subagents live in [`../.codex/agents`](../.codex/agents) and the shared monorepo Toss miniapp rules live at [`../AGENTS.md`](../AGENTS.md).

## Workflow contracts

- Product pivot brief: [`docs/product-pivot-2026-03-11.md`](./docs/product-pivot-2026-03-11.md)
- Workflow RFC: [`docs/workflow-rfc.md`](./docs/workflow-rfc.md)
- Ad behavior contract: [`docs/ad-behavior-contract.md`](./docs/ad-behavior-contract.md)
- Slot lifecycle contract: [`docs/slot-lifecycle-contract.md`](./docs/slot-lifecycle-contract.md)
- TDS UI contract: [`docs/tds-ui-contract.md`](./docs/tds-ui-contract.md)
- TDS component mapping: [`docs/tds-component-mapping.md`](./docs/tds-component-mapping.md)
- Metrics dashboard plan: [`docs/metrics-dashboard-plan.md`](./docs/metrics-dashboard-plan.md)
- Handoff template: [`docs/templates/handoff-template.md`](./docs/templates/handoff-template.md)
- Submission readiness report template: [`docs/templates/submission-readiness-report-template.md`](./docs/templates/submission-readiness-report-template.md)

## Included features

- Local-only plant diary records (no backend)
- Multiple plants with slot unlock
- Today-first capture flow focused on taking a good photo
- Daily diary entry for noticing current condition and fine detail
- Photo library/history for revisiting past records
- Camera quality guidance and detail-enhancement support
- Existing compare/report surfaces retained as secondary legacy flows during pivot
- Simplified home UX (plant switcher + today card + primary capture CTA)

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
intoss://plant-growth-miniapp
```

## Production Submission Checklist

Before console submission, replace placeholder values and run checks:

1. Set `brand.icon` in `granite.config.ts`
2. Set production adGroupIds in `src/config/ads.ts`
3. Run:

```bash
npm run submission:build
npm run submission:evidence
```

4. Confirm generated artifact:

```text
plant-growth-miniapp.ait
```

See detailed checklist in [`SUBMISSION_CHECKLIST.md`](./SUBMISSION_CHECKLIST.md).

## Required console values

Update these values in `granite.config.ts` to match your Apps-in-Toss console app:

- `appName`
- `brand.displayName`
- `brand.icon`
- adGroupId values in `src/config/ads.ts`:
  - `captureReward`

## Data policy in MVP

- All records are stored in local miniapp storage (`plant-growth-v3`)
- Same-day photos are overwritten per plant (1 photo per day per plant)
- Data does not sync between devices
- Reinstall/device change recovery is not supported in this version

## Current product direction

As of **March 11, 2026**, the app direction is:

- primary value: help users take a better photo of **today's plant**
- primary outcome: notice the plant's **current detail and condition**
- supporting surface: photo library / diary archive
- de-emphasized for now: growth-change scoring, comparison-first storytelling, and ad-to-report as the main journey

Implementation may still contain compare/timeline/report language while follow-up product and camera work catches up. The pivot brief above is the current source of truth for upcoming work.
