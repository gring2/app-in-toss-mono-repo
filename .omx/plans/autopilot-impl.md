# Autopilot Implementation Plan — Single Plant Camera

- Date: 2026-03-13
- Scope: `toss-plant-growth-miniapp` only

## Phase 1 — Plan verdict
Implement the single-camera redesign by reworking the existing `EnhanceCaptureLab` rather than introducing a new capture subsystem.

## Workstreams
### 1. Capture UX simplification
- Collapse preset-driven UX into one primary plant camera experience.
- Keep existing preset data only if needed internally; remove preset choice from the main visible flow.
- Rewrite copy for a single fast path.

### 2. Post-shot result + save flow
- Preserve current capture/quality/enhancement pipeline.
- Add explicit save action with `usePlantGrowth().addDailyPhoto`.
- Keep retake action obvious and immediate.
- Show original toggle only when useful.

### 3. State handling
- Add explicit flow states:
  - permission/loading
  - capture processing
  - empty/pre-capture
  - error
  - result-ready
  - save-in-progress
  - save-complete/failure messaging

### 4. Analytics
- Extend `src/analytics/events.ts` with single-camera lifecycle events or map existing events to the new lifecycle.
- Emit for capture open/success/failure, quality scored, filter applied, retake chosen, save started/completed/failed.

### 5. Docs/tests
- Update `docs/tds-component-mapping.md`.
- Update/add tests for:
  - single-camera CTA rendering
  - processing state
  - result state
  - save path
  - error/fallback behavior
  - route parity assumptions remain satisfied

## Concrete file targets
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.tsx`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.test.js`
- `toss-plant-growth-miniapp/src/components/captureExperienceCopy.ts`
- `toss-plant-growth-miniapp/src/components/captureExperienceCopy.test.js`
- `toss-plant-growth-miniapp/src/analytics/events.ts`
- `toss-plant-growth-miniapp/src/pages/index.tsx`
- `toss-plant-growth-miniapp/src/pages/capture.tsx`
- `toss-plant-growth-miniapp/docs/tds-component-mapping.md`

## Verification gates
- `cd toss-plant-growth-miniapp && npm run lint:check`
- `cd toss-plant-growth-miniapp && npm run typecheck`
- `cd toss-plant-growth-miniapp && npm run test`
- `cd toss-plant-growth-miniapp && npm run build`
- `cd toss-plant-growth-miniapp && npm run tds:check`

## Rollback guidance
- If save integration destabilizes the flow, keep the redesigned UI but revert save wiring to the prior safe state before release.
- If performance on real/sandbox devices materially exceeds the 5-second accepted bound, keep the single-camera UI but reduce filter complexity or shift to raw-fallback messaging.
