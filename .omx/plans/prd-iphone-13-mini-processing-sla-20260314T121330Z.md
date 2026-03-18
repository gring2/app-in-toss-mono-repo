# PRD — iPhone 13 mini 5-Second Processing SLA for Plant Photo Preview

- Project: toss-plant-growth-miniapp
- Date: 2026-03-14
- Planning mode: $ralplan consensus (performance remediation)
- Scope owner: camera processing contract + capture UX behavior for HEIC/JPEG inputs

## 1. Problem
The current plant photo flow does not satisfy the updated hard requirement: **photo processing must complete within 5 seconds on iPhone 13 mini spec**. The user reports about **23 seconds** for `/Users/jinwoopark/Downloads/IMG_0772.HEIC` on the target device class. Local Mac timings are not a valid substitute for the device SLA.

## 2. Key evidence
- Exact file under investigation: `/Users/jinwoopark/Downloads/IMG_0772.HEIC`
- File metadata observed locally: HEIC, 4032x3024
- Current local patched pipeline on that exact file: ~660ms total after downscaling normalized output to 768x1024
- Architect review already established the remaining blocker: HEIC still decodes synchronously at full resolution before resize
- `heic-decode` documentation notes most decode work is synchronous
- Low-level inspection shows this specific HEIC file has **no embedded thumbnail** to decode instead
- No grounded native HEIC fast path has been verified in the current Apps-in-Toss runtime

## 3. Goal
Meet a truthful, testable 5-second SLA on **iPhone 13 mini** for the supported filtered-preview experience.

## 4. Non-goals
- No claim that current JS/WASM HEIC filtered preview can meet the SLA without target-device proof
- No undocumented native fast path assumption
- No broad redesign of the rest of the app
- No backend changes

## 5. Product/technical decision boundary
There are two different possible requirements, and the plan must be explicit about which one is being satisfied:
1. **Strict HEIC filtered-preview SLA**: HEIC images must still get filtered preview under 5s on iPhone 13 mini
2. **Strict supported-path SLA**: the filtered-preview path must be under 5s on iPhone 13 mini, but HEIC may be routed to a raw fallback / JPEG-only contract

Given current grounded evidence, option (1) cannot be honestly guaranteed in the current public Apps-in-Toss runtime. Therefore the release plan must be based on option (2), unless the platform owner provides a verified native fast path.

## 6. Recommended product contract
### A. Supported fast filtered-preview path
- Guarantee the <5s SLA for **JPEG/high-compatibility** capture path on iPhone 13 mini
- Use device evidence, not desktop timing, as the release gate

### B. HEIC behavior
- Detect HEIC/HEIF early
- Do **not** promise filtered preview on that path until target-device evidence or native/platform support exists
- Route HEIC to a fast raw preview fallback (or equivalent safe fallback) with clear user guidance to use iPhone “High Compatibility” / JPEG path for filtered preview
- Emit explicit analytics for HEIC fallback rate and latency

### C. Release gating
- A build is not considered SLA-compliant until iPhone 13 mini evidence exists for the supported filtered path
- If HEIC remains slow on device, that is not a bug in the supported JPEG SLA path; it is an unsupported/guarded path with fallback

## 7. Workstreams
### Workstream 0 — Contract hardening
- Update product copy and engineering contract so the <5s promise applies only to the supported filtered-preview path
- Make HEIC fallback explicit in UI and event semantics

### Workstream 1 — Runtime behavior
- In `processingImage.ts`, add **header-level HEIC path classification before decode** and expose a reliable signal to the capture UI
- In `EnhanceCaptureLab.tsx`, enforce fast fallback behavior for HEIC **without invoking the slow filtered-preview attempt** when the SLA cannot be guaranteed
- Preserve filtered preview for JPEG path

### Workstream 2 — Instrumentation
- Log source mime type, normalization path, device timing, and fallback reasons
- Add a release-facing checklist item for target-device evidence on iPhone 13 mini

### Workstream 3 — Verification
- Add acceptance tests for HEIC classification/fallback behavior
- Run manual/device verification on iPhone 13 mini for the supported filtered-preview path

## 8. Acceptance criteria
1. The product contract is explicit: only the supported filtered-preview path is promised under 5 seconds
2. On iPhone 13 mini, the supported JPEG/high-compatibility filtered-preview path completes in **<=5.0 seconds** for the release test set
3. HEIC/HEIF does not block the user in a 20+ second processing path; it follows a fast fallback path with clear guidance
4. HEIC fallback is triggered from cheap mime/header classification and does **not** require full HEIC decode before the fallback decision
5. The app records which path was taken (JPEG filtered preview vs HEIC fallback)
6. Tests cover HEIC classification and fallback behavior
7. Current typecheck/lint/test/build/TDS guards remain green

## 9. Verification plan
- Unit:
  - `src/camera/processingImage.test.js`
  - `src/components/EnhanceCaptureLab.test.js`
  - analytics event coverage as needed
- Fresh repo verification:
  - `npm run typecheck`
  - `npm run lint:check`
  - `npm run test`
  - `npm run build`
- Required device evidence:
  - iPhone 13 mini stopwatch/timing log for the supported filtered-preview path
  - captured timings attached to submission/readiness evidence

## 10. Likely files
- `toss-plant-growth-miniapp/src/camera/processingImage.ts`
- `toss-plant-growth-miniapp/src/camera/processingImage.test.js`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.tsx`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.test.js`
- `toss-plant-growth-miniapp/src/analytics/events.ts`
- `toss-plant-growth-miniapp/src/components/captureExperienceCopy.ts` (if guidance copy changes)
- `toss-plant-growth-miniapp/docs/tds-component-mapping.md`
- submission-readiness report / evidence docs

## 11. Risks
- User may reject a JPEG-only / HEIC-fallback contract if filtered HEIC preview is still expected
- HEIC fallback may reduce perceived quality or product consistency
- Without target-device evidence, desktop improvements can produce false confidence

## 12. Rollback / fallback
- If the supported JPEG path still misses the SLA on iPhone 13 mini, revert the 5-second promise and mark the feature NO-GO for release
- If HEIC fallback messaging causes user confusion, keep fallback but revise copy before release
