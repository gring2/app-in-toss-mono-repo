# Test Spec — Plant Camera Redesign with Quality Preservation

- Project: toss-plant-growth-miniapp
- Date: 2026-03-13

## A. Core test objective
Prove that the redesigned capture flow improves plant-photo guidance and filter presentation without regressing supported camera behavior, Toss compatibility, or current quality/enhancement output.

## B. Unit tests
1. `src/camera/presets.test.js`
   - default mode metadata stays valid
   - current preset IDs/data contract stay valid in V1 unless a separate migration is explicitly approved
   - one primary recommended mode is still identifiable while secondary modes retain valid filter/framing metadata
2. `src/components/captureExperienceCopy.test.js`
   - permission copy maps correctly
   - retake guidance copy reflects quality reasons
   - loading/empty/error copy exists for redesigned states
3. `src/camera/quality.test.js`
   - current thresholds and recommendation behavior stay green
4. `src/camera/enhancement.test.js`
   - enhancement output rules remain green
5. New capture state tests
   - pre-capture state
   - processing state
   - unsupported-format fallback state
   - enhancement failure fallback state
   - review state with original/filter toggle
   - review state with explicit retake/save actions
6. Save-path tests
   - save action calls `usePlantGrowth().addDailyPhoto` with enhanced image + source metadata
   - same-day overwrite behavior is preserved
7. Analytics event tests
   - redesigned capture events emit a documented schema for capture open/success/fail and save started/completed/failed

## C. UI/integration tests
1. Capture page renders redesigned entry layout.
2. Home route (`/`) and capture route (`/capture`) render the same redesigned experience.
3. Busy state disables primary actions.
4. Permission denied state shows recovery CTA.
5. Empty state shows first-capture guidance.
6. Post-capture review shows filter-first view and retake/save actions.

## D. Manual QA matrix
1. Permission paths
   - checking
   - notDetermined -> request -> allowed
   - denied -> retry guidance
2. Capture outcomes
   - normal JPEG success
   - HEIC/HEIF normalization path
   - unsupported format fallback
   - enhancement failure fallback
3. Quality scenarios
   - blurry
   - low light
   - overexposed
   - plant too small
   - good-quality close-up
4. Diary/storage behavior
   - save for active plant
   - same-day overwrite preserved
   - post-save flow returns correctly
   - enhanced image persists with source metadata when available

## E. Regression guardrails
- No red tests in existing camera quality / enhancement suites.
- Release invariants remain unchanged: `openCamera({ base64: true, maxWidth: 1280 })`, `MACRO_ENHANCEMENT_VERSION = 'macro_pop_v4'`, and current `quality.ts` thresholds/fallback behavior.
- No TDS check failures.
- No new raw RN interaction primitives introduced.
- Build succeeds with current Granite/App-in-Toss configuration.

## F. Commands
- `cd toss-plant-growth-miniapp`
- `npm run lint:check`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run tds:check`

## G. Exit criteria
- All commands pass.
- Manual QA covers at least one high-quality plant close-up sample and one poor-quality retake sample.
- Manual QA verifies save behavior from both `/` and `/capture` entry paths.
- Reviewer confirms no unsupported camera API or dependency was introduced.
- Analytics verification confirms capture lifecycle plus save started/completed/failed coverage.
