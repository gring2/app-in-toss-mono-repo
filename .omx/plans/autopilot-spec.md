# Autopilot Spec — Single Plant Camera with Fast Post-Shot Filter

- Date: 2026-03-13
- App: `toss-plant-growth-miniapp`
- Context snapshot: `.omx/context/custom-plant-camera-redesign-20260313T125243Z.md`
- Prior consensus inputs:
  - `.omx/plans/prd-custom-plant-camera-redesign-20260313T125243Z.md`
  - `.omx/plans/test-spec-custom-plant-camera-redesign-20260313T125243Z.md`

## 1) Product requirements
- Ship **one** plant-focused camera flow only.
- User flow must be simple: **take photo -> filtered preview -> decide (retake/save)**.
- Use `openCamera` for capture because official Apps-in-Toss support is grounded there.
- Apply the plant filter **after capture** and show the preview fast enough for the experience to feel immediate; user accepts up to about **5 seconds**.
- Save the chosen filtered result through the existing diary/storage path.
- Keep the same experience on both `/` and `/capture`.

## 2) Hard constraints
- No true live in-camera WYSIWYG preview is assumed; current official Apps-in-Toss docs do not ground that path.
- Preserve current quality pipeline baseline:
  - `openCamera({ base64: true, maxWidth: 1280 })`
  - `MACRO_ENHANCEMENT_VERSION = 'macro_pop_v4'`
  - current `src/camera/quality.ts` thresholds/fallback behavior
- Keep Toss-compatible UI with `@toss/tds-react-native` controls.
- All new/changed flows must include loading, empty, and error states.
- No new dependency unless explicitly required.
- Ad behavior must not worsen the capture experience; no new ad placements in this scope.

## 3) Non-goals
- No live filtered preview before shutter.
- No multiple camera modes/preset chooser in the main UX.
- No compare/timeline redesign outside minimal compatibility adjustments.
- No backend or sync changes.
- No camera-native dependency or undocumented host integration.

## 4) UX simplification requirements
Remove or de-emphasize from current capture UX:
- preset tabs/buttons (`diary`, `detail`, `whole`) as a primary choice surface
- mode-heavy copy that makes the user choose a camera style before capture
- analysis-only result state without a save action

Replace with:
- one primary plant camera hero/shell
- one primary capture CTA
- one processing state that sets expectation for quick filter generation
- one filtered preview result with optional original toggle when meaningful
- one clear retake CTA and one clear save CTA

## 5) Retention/guardrail spec
- Hypothesis: simpler single-camera flow improves capture completion and repeat use versus preset-selection friction.
- KPI expectation: capture-to-save +4% to +8%.
- Guardrails:
  - save success does not drop by more than 1pp
  - retake-abandonment does not rise by more than 3pp
  - no regression in current quality/enhancement tests
- Event coverage must include permission, capture start/success/failure, quality scored, filter applied, retake chosen, save started/completed/failed.

## 6) Monetization spec
- No new ad placement or pacing change inside the new single-camera flow.
- Existing monetization must not interrupt capture, processing, preview, retake, or save.
- Rollback trigger for monetization interference: any blocker in capture -> preview -> save path is a no-go.

## 7) Acceptance criteria
1. User sees one plant camera experience with one primary capture CTA.
2. After capture, app shows a processing/loading state and then a filtered preview.
3. On supported JPEG path, filtered preview appears successfully and feels fast; user-accepted upper bound is about 5 seconds.
4. User can choose **Retake** or **Save** from the result screen.
5. Save writes via `usePlantGrowth().addDailyPhoto` and preserves same-day overwrite behavior.
6. Both `/` and `/capture` routes show the same redesigned flow.
7. Current quality/enhancement tests remain green.
8. No unsupported camera API or new dependency is introduced.
9. Loading/empty/error states are present.
10. `docs/tds-component-mapping.md` reflects the new single-camera flow.

## 8) Risks / unknowns
- Real device performance may be slower than local benchmark, especially when format normalization is needed.
- HEIC/HEIF conversion may consume a noticeable part of the 5-second budget.
- User may still perceive post-shot filtering as “not true camera,” even if fast enough.

## 9) Implementation-ready notes
- Current likely touchpoints:
  - `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.tsx`
  - `toss-plant-growth-miniapp/src/components/captureExperienceCopy.ts`
  - `toss-plant-growth-miniapp/src/analytics/events.ts`
  - `toss-plant-growth-miniapp/src/pages/index.tsx`
  - `toss-plant-growth-miniapp/src/pages/capture.tsx`
  - `toss-plant-growth-miniapp/docs/tds-component-mapping.md`
- Existing save API is already available in `usePlantGrowth().addDailyPhoto`.
- Existing image processing benchmark on host machine suggests the current post-shot filter path is comfortably within the 5-second budget, but device QA must verify that assumption.
