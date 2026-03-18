# Ralph Context Snapshot

> Superseded in product framing by `.omx/context/today-detail-diary-pivot-20260311.md`.
> Keep this file only as camera-work history for the pre-pivot compare/change direction.

- task_statement: Implement the agreed camera-focused plan using software-enhanced macro flow in the plant miniapp.
- desired_outcome: Improve capture quality guidance and processing for macro-like plant photos, reduce false "large change" from angle/distance variance, keep app local-only and Toss-compatible.

## known_facts_evidence
- Current capture uses `openCamera({ base64: true, maxWidth: 720 })` in `src/pages/capture.tsx`.
- SDK surface in local deps shows limited camera controls (no manual focus/zoom controls exposed to current app code).
- Current compare scoring in `src/reports/scoring.ts` can return high score early when quick scene check is clearly different.
- User wants local-only and no SNS.
- Existing consensus plan artifact: `.omx/plans/consensus-local-macro-camera-plan-2026-03-10.md`.

## constraints
- Local-only data handling; no backend/SNS.
- Preserve Toss miniapp compatibility and existing routing.
- Do not break current capture/report core flow.
- Keep implementation practical within existing dependencies.

## unknowns_open_questions
- Exact threshold tuning for quality recommendation may need iterative calibration.
- Runtime performance of enhancement on lower-end devices needs practical guardrails.

## likely_codebase_touchpoints
- `src/pages/capture.tsx`
- `src/content/copy.ts`
- `src/analytics/events.ts`
- `src/reports/scoring.ts`
- new modules under `src/camera/*`
- tests under `src/camera/*` and `src/reports/*`
