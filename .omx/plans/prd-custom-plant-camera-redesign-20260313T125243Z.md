# PRD — Plant Camera Redesign with Quality-Preserved Plant Filter

- Project: toss-plant-growth-miniapp
- Date: 2026-03-13
- Planning mode: $ralplan consensus (short mode)
- Scope owner: capture flow only unless explicitly expanded later

## 1. Problem
The current capture experience is a custom framing shell followed by the Toss system camera handoff. The user explicitly rejected the current direction and wants a new camera design with a plant-specialized filter while keeping capture quality at least equal to the existing implementation.

## 2. Goal
Ship a redesigned plant-first capture experience that:
1. Feels meaningfully more custom and plant-specialized than the current shell.
2. Preserves the existing image-quality baseline from the current quality scoring and enhancement pipeline.
3. Stays within official Apps-in-Toss React Native constraints.
4. Improves confidence and repeat use for “today’s plant” diary capture.

## 3. Non-goals
- No backend or sync changes.
- No new camera dependency or undocumented native camera preview integration in this release scope.
- No compare/timeline redesign beyond copy or navigation adjustments directly required by capture flow.
- No ad model change in this scope.

## 4. Constraints / evidence
- Official Apps-in-Toss RN camera API documented today: `openCamera(options)` launches the camera and returns an image response.
- Local SDK inspection found only `openCamera`-centric camera support.
- Current repo already contains plant-specific quality/enhancement logic:
  - `src/camera/presets.ts`
  - `src/camera/quality.ts`
  - `src/camera/enhancement.ts`
  - `src/detection/plantDetector.ts`
- TDS contract requires TDS-visible controls and explicit loading/empty/error states.
- No new dependency without explicit request.

## 5. Product decision
Deliver a redesigned **custom plant capture workspace around the official system-camera handoff**, preserving the current quality/enhancement engine and strengthening the pre-capture framing guidance, post-capture review, retake loop, and plant filter presentation.

If stakeholders still require a true live in-app camera preview, treat it as a separate feasibility spike because current official evidence does not confirm support.

## 6. User experience scope
### A. Pre-capture workspace redesign
- Replace current `EnhanceCaptureLab` information-heavy shell with a more focused plant camera entry surface.
- Preserve the current preset data contract (`diary` / `detail` / `whole`) in V1, but visually re-rank the experience so one plant-first primary mode is emphasized and secondary modes are de-emphasized behind weaker controls.
- Make plant framing intent clearer:
  - main plant zone
  - leaf/detail focus hint
  - distance / lighting hint
  - “why this helps” copy tied to quality reasons

### B. Capture handoff
- Continue using official `openCamera({ base64: true, maxWidth: 1280 })` unless quality validation shows a better supported width.
- Preserve current permission flow and error handling.

### C. Post-capture review redesign
- Present filter result as the default review state.
- Show “original vs plant filter” toggle only when the filter is applied.
- Promote a clear save / retake decision path.
- Translate quality failures into specific retake guidance before save.
- Wire the save action to the existing diary/storage path via `usePlantGrowth().addDailyPhoto`, preserving current same-day overwrite behavior and storing both filtered and source-image metadata when available.

### D. Quality-preservation rules
- Keep current quality scoring baseline and enhancement pipeline as release baseline.
- Any tuning to presets/filter language must not reduce accepted image quality relative to current tests and curated before/after samples.
- Preserve plant detection + quality scoring before enhancement.
- Lock the current supported capture baseline for this release unless a separate ADR explicitly changes it:
  - `openCamera({ base64: true, maxWidth: 1280 })`
  - `MACRO_ENHANCEMENT_VERSION = 'macro_pop_v4'`
  - current `src/camera/quality.ts` thresholds and fallback behavior

## 7. Workstreams
### Workstream 0 — Feasibility checkpoint
- Confirm release scope is the supported custom capture workspace around `openCamera`, not an undocumented live in-app preview camera.
- If stakeholders insist on a literal live preview camera, spin a separate technical spike and do not block the supported redesign release on it.

### Workstream 1 — Spec gate
- Retention UX Specialist: capture journey, repeat-use hypothesis, KPI guardrails, retake/save instrumentation.
- Monetization Specialist: explicitly mark no new ad placements in capture redesign; confirm existing monetization does not interrupt the new capture path.

### Workstream 2 — Design gate
- Toss Miniapp UI Designer delivers Toss-compatible screen spec and component-state mapping.
- Update `docs/tds-component-mapping.md` for the redesigned capture flow.

### Workstream 3 — Build gate
- Update both routes that currently render `EnhanceCaptureLab` (`src/pages/index.tsx` and `src/pages/capture.tsx`) so the redesigned experience is consistent from home and direct `/capture` entry.
- Refactor `EnhanceCaptureLab.tsx` into smaller presentational/flow units if needed.
- Integrate the post-capture save flow with existing plant diary state (`usePlantGrowth` / `addDailyPhoto`) instead of leaving the capture page as analysis-only UI.
- Preserve the existing enhancement/quality modules as baseline; only adjust preset wiring/copy/presentation unless test evidence justifies algorithm tuning.
- Expand analytics event coverage in `src/analytics/events.ts` to cover the redesigned path end-to-end, including save started/completed/failed, or explicitly remap those moments to the existing schema.

### Workstream 4 — Verification gate
- Add/refresh unit tests for presets, copy, quality guardrails, and capture decision states.
- Run lint, typecheck, tests, TDS check, and build.

## 8. Acceptance criteria
1. Capture entry UI is visibly redesigned and plant-first, using TDS controls for all visible interactions.
2. Flow still uses supported Apps-in-Toss APIs only; no undocumented live camera preview dependency is introduced.
3. Loading / empty / error states are implemented for the redesigned capture flow.
4. Existing quality baseline is preserved:
   - current quality scoring tests remain green
   - enhancement tests remain green
   - `openCamera` capture params remain supported
   - curated before/after QA samples show no regression versus current release branch behavior
5. Post-capture screen defaults to plant-filter review, provides safe retake + save actions, and writes via `usePlantGrowth().addDailyPhoto` through the existing diary/storage path.
6. Save path preserves existing storage semantics:
   - active plant is respected
   - same-day overwrite still works
   - filtered image is saved as the display artifact
   - original/source metadata is retained when available for comparison/reporting compatibility
7. The current V1 preset contract (`diary`, `detail`, `whole`) remains intact in this release.
8. Instrumentation covers: permission checked, camera open requested/succeeded/failed, quality scored, retake prompted/chosen, filter applied, save started/completed/failed.
9. `docs/tds-component-mapping.md` is updated and route parity is preserved for both `/` and `/capture`.
10. A documented loading state, empty state, and error state exist for the redesigned capture flow.

## 9. Verification plan
- Unit: existing `src/camera/*.test.js`, `captureExperienceCopy.test.js`, plus new tests for redesigned flow state helpers.
- Integration/UI: render tests for redesigned capture states.
- Manual QA:
  - permission denied / notDetermined / allowed
  - unsupported format fallback
  - low-light / blurry / plant-too-small guidance
  - filter applied vs original toggle
  - same-day save/overwrite path still intact
  - both `/` and `/capture` routes present the same redesigned experience
- Build checks:
  - `npm run lint:check`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run tds:check`

## 10. Likely files
- `toss-plant-growth-miniapp/src/pages/capture.tsx`
- `toss-plant-growth-miniapp/src/pages/index.tsx`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.tsx`
- `toss-plant-growth-miniapp/src/components/captureExperienceCopy.ts`
- `toss-plant-growth-miniapp/src/camera/presets.ts`
- `toss-plant-growth-miniapp/src/camera/*.test.js`
- `toss-plant-growth-miniapp/src/analytics/events.ts`
- `toss-plant-growth-miniapp/src/hooks/usePlantGrowth.ts`
- `toss-plant-growth-miniapp/docs/tds-component-mapping.md`
- optional new capture subcomponents under `src/components/`

## 11. Risks
- User expectation mismatch if “custom camera” is interpreted as a true live in-app camera preview.
- Reworking filter tuning could accidentally regress quality if algorithm changes are made without sample-based validation.
- Current capture surface is duplicated on `/` and `/capture`; redesign drift across those routes would create inconsistent entry behavior.
- Overloading the capture screen could hurt completion instead of helping.

## 12. Architect review synthesis
- Steelman antithesis: if “custom camera” literally means a live in-app camera preview with bespoke controls, this plan intentionally does not promise that because the official/current SDK evidence does not support it.
- Real tradeoff tension: user intent pushes toward a bespoke camera feel, while platform compliance pushes toward a system-camera handoff.
- Synthesis: ship the strongest supported custom capture workspace now, keep the quality engine stable, and isolate any true live-preview exploration into a non-blocking spike.

## 13. Rollout / fallback
- Release as a capture-flow-only redesign.
- If quality regression appears in QA, revert to existing enhancement params and ship UI redesign only.
- If platform limitation blocks desired live preview behavior, keep supported handoff design and explicitly log feasibility gap.
