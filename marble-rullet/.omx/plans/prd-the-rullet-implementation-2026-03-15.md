# PRD — The Rullet mono WebView implementation

## 1. Summary
Implement the approved The Rullet mono redesign in `source/` on the existing Apps-in-Toss WebView runtime. Preserve marble physics and fairness feel while shipping a restrained, trustworthy, smartphone-friendly `Compose -> Draw -> Result` flow that feels aligned to Toss mood and clearly less like the original Marble Roulette.

## 2. Source of truth
1. `.omx/reports/the-rullet-implementation-brief-2026-03-15.md`
2. `.omx/reports/the-rullet-mono-ui-spec-2026-03-15.md`
3. `.omx/reports/the-rullet-retention-ux-handoff-2026-03-15.md`
4. `.omx/reports/the-rullet-monetization-guardrails-2026-03-15.md`
5. `.omx/context/rullet-implementation-toss-mood-latest.md`
6. `.omx/plans/rullet-mono-designer-consensus-plan-2026-03-15.md`

## 3. Problem
The current app already works, but its copy, structure, and visual energy still read too close to the original Marble Roulette. It over-indexes on bright/game-like styling and does not yet fully express a Toss-adjacent utility mood or a repeat-use mobile flow.

## 4. Goals
- Ship the approved mono redesign in the current `source/` WebView app.
- Preserve marble physics, fairness trust, and current draw behavior.
- Reframe the IA to `Compose -> Draw -> Result`.
- Make Compose and Result utility-led; keep Draw focused and minimal.
- Improve repeat-use behavior with recent presets and a primary `Rerun draw` action.
- Add explicit loading / empty / error states for all user-facing flows.

## 5. Non-goals
- No runtime migration to React Native/Granite for this task.
- No monetization surface in the v1 core flow.
- No changes that alter draw fairness or marble physics.
- No celebratory/gambling-style visual effects.

## 6. Users / JTBD
When a user needs to pick one or more winners fairly from a group on mobile, they want to prepare names quickly, trust the draw animation, and rerun the same group with minimal friction.

## 7. Experience decisions
- Rename setup framing to `Compose` / `마블 추첨` utility framing.
- Preserve one-screen composition with participant entry, winner mode, advanced map option, and recent presets.
- Keep Draw nearly chrome-free with a compact status pill and edit exit.
- Make Result primary CTA `Rerun draw`, secondary `Edit names`, tertiary `Copy result`.
- Keep mono-first palette: black / white / gray, with only a restrained accent if needed.
- Reduce clone feel by changing copy, hierarchy, spacing rhythm, and chrome—not just colors.

## 8. Functional requirements
### Compose
- Support newline/comma-separated names.
- Normalize and dedupe names using current parsing logic.
- Disable start until at least one valid participant exists.
- Clamp custom rank to `1..participantCount`.
- Keep map selector in collapsed advanced options.
- Restore previous input, mode, map, and recent presets when available.
- Show loading/empty/error messaging for presets/storage/input validation.

### Draw
- Transition into a minimal draw state after successful validation.
- Preserve current canvas runtime and marble physics.
- Show preparation/loading messaging before visible motion starts.
- Provide explicit exit/edit action with confirmation once a draw is running.
- Redirect invalid empty draw state back to Compose.
- Show a recoverable screen/message if physics/render init fails.

### Result
- Show winner, selected rank, participant count, and full ordered ranking.
- Keep winner distinct but restrained.
- Support rerun with last successful participant set and current mode.
- Support edit with state preserved.
- Support copy with success/failure feedback.
- Show fallback empty/error state if ranking snapshot is missing.

## 9. State requirements
Every user-facing flow must define:
- Loading state
- Empty state
- Error state

Minimum coverage:
- preset storage load/failure
- empty participant input
- custom rank validation
- draw bootstrap/loading
- draw engine failure
- result ranking fallback
- copy failure

## 10. Metrics / instrumentation
Implement or preserve hooks/placeholders aligned to the reports where practical:
- `compose_viewed` / `setup_view`
- `participants_loaded`
- `winner_mode_changed`
- `custom_rank_changed` / `custom_rank_set`
- `draw_started`
- `draw_cancelled` / `draw_exit_confirmed`
- `draw_completed`
- `result_rerun_tapped`
- `result_edit_tapped`
- `result_copied`
- `presets_cleared`
- `error_toast_shown`

If analytics plumbing does not exist yet, leave a lightweight internal event helper / console-safe stub rather than expanding scope into backend integration.

## 11. Monetization guardrails
- No banners, no interstitials, no rewarded prompts, no IAP prompts in Compose / Draw / Result core path for v1.
- Do not reserve visible broken space for future ads in this implementation.
- Keep future monetization below result actions only, but do not ship it now.

## 12. Acceptance criteria
- Current runtime remains WebView/Parcel unless a blocker is discovered.
- Marble physics behavior is preserved.
- Compose / Draw / Result are the visible product states.
- Compose and Result are not dominated by full-screen canvas.
- Draw remains focused and mostly full-screen with minimal mono chrome.
- Loading / empty / error states exist for all user-facing flows.
- No monetization is present in the v1 core flow.
- Lint, typecheck/diagnostics, and build verification are run and documented.
- Architect sign-off is obtained before completion.

## 13. File touchpoints
Primary:
- `source/index.html`
- `source/assets/style.scss`
- `source/src/app.ts`
- `source/src/data/constants.ts`

Secondary if needed:
- minimal supporting theme/copy/state files in `source/src/**`

## 14. Risks
- Over-styling the app back toward game/casino energy.
- Breaking fairness trust via heavy overlays or flashy winner treatment.
- Regressing rerun speed by adding friction to Compose/Result.
- Introducing runtime bugs while touching state transitions around draw start/result handoff.

## 15. Verification strategy
- Affected-file diagnostics clean.
- Lint pass.
- Build pass.
- Manual smoke verification of Compose, Draw, Result, presets, rerun, copy, and edge states.
- Explicit note of test-script gap if no automated tests exist.
