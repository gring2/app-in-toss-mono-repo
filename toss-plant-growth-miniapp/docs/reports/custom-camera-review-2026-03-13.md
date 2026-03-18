# Custom Camera Review — 2026-03-13

## Context
- App: `toss-plant-growth-miniapp`
- Requested direction: "create custom camera with new design" and keep plant-photo quality comparable to previous work.
- Reviewed files:
  - `src/pages/capture.tsx`
  - `src/components/EnhanceCaptureLab.tsx`
  - `src/camera/presets.ts`
  - `src/camera/processingImage.ts`
  - `src/camera/quality.ts`
  - `src/camera/enhancement.ts`
  - `README.md`
  - `docs/tds-component-mapping.md`
- Official docs checked on 2026-03-13:
  - `openCamera` reference: https://developers-apps-in-toss.toss.im/references/sdk-modules/open-camera.md
  - Camera permission guide: https://developers-apps-in-toss.toss.im/guides/native/camera-permission.md

## Decision
**Decision:** treat the current capture redesign as a **guided camera experience built around `openCamera`**, not as a fully custom in-app camera implementation.

**Why:** the current code path in `src/components/EnhanceCaptureLab.tsx` still opens the system camera (`openCamera({...})`) and applies plant-specific scoring/enhancement after capture. I did not find an official Apps-in-Toss document in this review pass that confirms a supported fully custom in-app camera preview surface for this miniapp.

**Metric impact expectation:** this decision should reduce capture-start and permission-regression risk versus a full camera rewrite while still supporting incremental gains in good-photo-save rate through preset tuning, plant detection, and post-capture enhancement.

## Output

### 1) Current implementation summary
- `/capture` is a thin route that renders `EnhanceCaptureLab`.
- `EnhanceCaptureLab` provides:
  - preset selection (`today`, `detail`, `whole`)
  - framing guidance
  - system camera launch via `openCamera`
  - MIME normalization for JPEG/HEIC/PNG
  - plant detection + quality scoring
  - optional light detail enhancement
  - original/enhanced preview toggle
- This is a **designed capture flow**, but not a **custom live camera UI**.

### 2) Strengths in the current camera stack
1. **Preset model is isolated and readable**
   - `src/camera/presets.ts` cleanly separates user-facing mode copy from processing behavior.
2. **Plant-photo quality logic is modular**
   - normalization, quality scoring, detection, and enhancement are split into dedicated modules.
3. **Test coverage for the image pipeline is already good**
   - enhancement, quality scoring, normalization, heuristic detection, and scoring tests passed during this review.
4. **Graceful fallback behavior exists for unsupported formats**
   - unsupported/decode-failed inputs fall back to original preview rather than hard-failing the flow.

### 3) Code-quality / product gaps
1. **Not yet a true custom camera**
   - `src/components/EnhanceCaptureLab.tsx:167-170` still launches the native/system camera through `openCamera`.
   - New UI is currently pre-capture/post-capture guidance around that handoff.
2. **Preset choice does not change capture hardware/input behavior yet**
   - all presets share the same `openCamera` input (`base64: true`, `maxWidth: 1280`).
   - today/detail/whole mostly change copy and whether light enhancement runs.
3. **Decode fallback is too optimistic**
   - `src/camera/quality.ts:119-139` returns a fallback score of `68` with recommendation `good` when JPEG decode fails.
   - This protects the flow, but it can overstate capture quality and weaken retake guidance.
4. **Low-level base64 helpers are duplicated**
   - `extractPayload` and `decodeBase64` are repeated in:
     - `src/camera/processingImage.ts`
     - `src/camera/quality.ts`
     - `src/camera/enhancement.ts`
   - This increases maintenance cost and makes future bug fixes easy to miss in one module.
5. **Documentation gap**
   - existing docs describe the capture redesign direction, but they do not explicitly state that the implementation still depends on the Apps-in-Toss system camera handoff.

### 4) Recommendation by horizon

#### Now (safe / low-risk)
- Keep the current architecture as:
  - **guided pre-capture UI**
  - **system camera handoff via `openCamera`**
  - **plant-specialized scoring + enhancement after capture**
- Document this explicitly so design/review/submission do not call it a fully custom camera.

#### Next (high-value follow-up)
1. Make preset choice influence capture-policy decisions more clearly:
   - mode-specific copy is already present
   - add mode-specific output/quality thresholds or processing behavior
2. Replace optimistic decode fallback with a neutral/uncertain state:
   - avoid showing “good” quality when the decoder could not verify the image
3. Extract shared image/base64 utility helpers into one internal module
   - reduces duplication across normalization/scoring/enhancement

#### Later (only after platform feasibility is confirmed)
- Revisit a true custom in-app camera surface **only if** official Apps-in-Toss support for that UX is confirmed for the target runtime.
- Until then, optimize the current system-camera-backed flow instead of rewriting the capture stack blindly.

## Risks
- **Release messaging risk:** stakeholders may think the branch already includes a custom live camera UI when it does not.
- **Guidance accuracy risk:** decode failure can still surface a “good” quality recommendation.
- **Maintenance risk:** duplicated low-level helpers may drift during future tuning.
- **Platform risk:** a custom camera rewrite may exceed currently documented miniapp capabilities.

## Next owner
- **Next owner:** `toss_miniapp_developer`
- **Requested next action:** implement only the safe follow-up items above unless the team first confirms platform support for a true custom in-app camera.

## Verification
- PASS — targeted camera/image pipeline tests
  - Command: `npm test -- --runInBand src/camera/quality.test.js src/camera/enhancement.test.js src/camera/processingImage.test.js src/camera/presets.test.js src/detection/providers/heuristicPlantDetector.test.js src/plants/image.test.js src/reports/scoring.test.js`
  - Result: `7/7` suites passed, `25/25` tests passed.
- PASS — review against official Apps-in-Toss camera documentation
  - Checked `openCamera` reference and camera permission guide linked above.
- NOTE — this review did **not** add runtime feature code, so no new sandbox/device e2e evidence was produced in this task.
