# The Rullet implementation brief — 2026-03-15

## Goal
Implement the approved mono redesign for The Rullet in the current `source/` WebView app, preserving marble physics while making the UX feel simpler, smartphone-friendly, and in the same overall mood as Toss.

## Source of truth
1. `.omx/reports/the-rullet-mono-ui-spec-2026-03-15.md`
2. `.omx/reports/the-rullet-retention-ux-handoff-2026-03-15.md`
3. `.omx/reports/the-rullet-monetization-guardrails-2026-03-15.md`
4. `.omx/plans/rullet-mono-designer-consensus-plan-2026-03-15.md`

## Non-negotiable product constraints
- Keep the current runtime as the existing `source/` WebView app unless a blocker forces otherwise.
- Preserve marble physics and fairness feeling.
- Reduce clone-feel versus the original lazygyu Marble Roulette.
- Make the UX feel in the same mood as Toss: restrained, trustworthy, clean, utility-first, high legibility, low visual noise, non-gambling.
- Stay mono-first: black / white / gray, with at most one restrained accent.
- Include explicit loading / empty / error states for all user-facing flows.
- No monetization surface in the core flow for v1.

## Frozen implementation decisions
- Information architecture: `Compose -> Draw -> Result`
- Runtime decision: stay on current WebView/Parcel stack for this implementation
- Canvas containment decision:
  - `Compose`: no full-screen canvas dominance
  - `Draw`: canvas may remain the primary full-screen event surface, but with minimal mono chrome only
  - `Result`: no persistent full-screen canvas dominance; result content should lead
- Primary retention action on result: `Rerun draw`
- Secondary: `Edit names`
- Tertiary: `Copy result`
- Advanced options stay collapsed / de-emphasized

## Toss-mood UX interpretation
- Use quiet surfaces, strong spacing rhythm, clear typography hierarchy, restrained motion, and trust-first copy.
- Avoid neon / arcade / casino energy.
- Avoid decorative clutter, celebratory excess, or playful effects that weaken fairness trust.
- Aim for “feels at home next to Toss” rather than “looks exactly like Toss”.

## Expected file touchpoints
- `source/index.html`
- `source/assets/style.scss`
- `source/src/app.ts`
- `source/src/data/constants.ts`
- any minimal supporting files required for state/copy/theme cleanup

## Verification expectations
- Fresh typecheck pass
- Fresh lint pass
- Fresh build pass
- Diagnostics clean on affected files
- If there is still no test script, document the explicit test gap and add the best lightweight verification possible
- Architect verification before completion
