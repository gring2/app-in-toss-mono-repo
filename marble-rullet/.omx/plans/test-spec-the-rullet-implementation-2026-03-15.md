# Test Spec — The Rullet mono WebView implementation

## Scope
Verification for the The Rullet mono redesign in `source/`, using the 2026-03-15 implementation brief and handoff docs as acceptance criteria.

## Test objectives
1. Preserve marble physics / fairness behavior.
2. Verify the new `Compose -> Draw -> Result` IA and Toss-mood UI treatment.
3. Verify loading / empty / error states across all user-facing flows.
4. Verify no monetization appears in the v1 core flow.
5. Verify repeat-use actions (`Recent presets`, `Rerun draw`, `Edit names`, `Copy result`).

## Automated verification targets
- Diagnostics clean on changed files.
- `npm run lint`
- `npm run build`
- If no `typecheck` or `test` script exists, document that gap and use the strongest lightweight alternatives available.

## Functional test matrix

### A. Compose screen
- [ ] App launches into Compose/root state.
- [ ] Title/copy reflects utility framing instead of game/roulette framing.
- [ ] Participant textarea accepts newline-separated names.
- [ ] Participant textarea accepts comma-separated names.
- [ ] Blur normalization preserves current parse rules (`/weight`, `*count`) while deduping.
- [ ] Participant count updates correctly.
- [ ] Start CTA disabled for zero valid names.
- [ ] Start CTA enabled for valid names.
- [ ] Winner mode segmented control updates selected state.
- [ ] Custom rank field appears only in custom mode.
- [ ] Custom rank clamps to valid range.
- [ ] Advanced options stay collapsed by default.
- [ ] Map selection changes persist without blocking start.
- [ ] Recent presets render after a successful draw.
- [ ] Empty preset state copy appears when no presets exist.
- [ ] Preset clear action works and shows feedback.
- [ ] Storage/preset failure falls back gracefully if simulated.

### B. Draw screen
- [ ] Starting a draw transitions from Compose to Draw.
- [ ] Canvas remains the primary surface only on Draw.
- [ ] Draw top chrome is minimal and readable.
- [ ] Loading/preparation copy appears before motion if needed.
- [ ] Exit/edit action is visible.
- [ ] Exiting during a running draw requires confirmation.
- [ ] Confirming exit returns to Compose safely.
- [ ] No monetization or interruptive overlay appears.
- [ ] If invalid draw state occurs, app routes back to Compose or shows recoverable error.

### C. Result screen
- [ ] Completed draw routes automatically to Result.
- [ ] Winner name is prominent and legible.
- [ ] Result metadata shows rank and participant count.
- [ ] Ordered ranking list renders correctly.
- [ ] Winner row is visually distinct but restrained.
- [ ] Empty ranking fallback appears if snapshot is missing.
- [ ] `Rerun draw` restarts using last successful participant set.
- [ ] `Edit names` returns to Compose with state preserved.
- [ ] `Copy result` writes shareable text and shows success toast.
- [ ] Copy failure path shows error toast.
- [ ] No monetization surface appears above/below the action block in v1.

### D. Visual / UX guardrails
- [ ] App is mono-first and substantially less neon/game-like than before.
- [ ] Compose and Result are not visually dominated by the canvas.
- [ ] Draw retains enough motion/focus to preserve the product signature.
- [ ] UI feels smartphone-friendly: spacing, sticky CTA, readable hierarchy.
- [ ] Copy/motion do not imply gambling or altered odds.

## Manual smoke scenarios
1. Fresh load with empty localStorage.
2. Enter 3 simple names -> Start draw -> view result -> rerun.
3. Enter comma-separated names with duplicates -> blur normalize -> draw.
4. Switch to custom rank, input out-of-range rank, verify clamping.
5. Change map in advanced options, run draw, verify no crash.
6. Save/use recent preset, then clear presets.
7. Start draw, tap edit during run, cancel exit, then confirm exit.
8. Copy result after a completed draw.
9. Refresh after prior use, confirm restored state/presets.

## Explicit test gap notes
- The project currently has no `npm test` script.
- The project currently has no dedicated `typecheck` script; use direct TypeScript compilation or diagnostics if feasible, otherwise document the limitation.
- Physics fairness is verified by preserving the existing engine/runtime and smoke-testing behavior, not by new probabilistic automation in this task.

## Exit criteria
- Required automated checks pass or any unavoidable gap is documented precisely.
- Manual smoke coverage for Compose, Draw, Result, and key edge states is recorded.
- Reviewer/architect sign-off can compare shipped behavior against this checklist.
