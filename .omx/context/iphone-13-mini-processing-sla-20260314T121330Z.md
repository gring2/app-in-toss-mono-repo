# Context Snapshot — iphone-13-mini-processing-sla

- Timestamp (UTC): 2026-03-14T12:13:30Z
- Task statement: Re-plan the image-processing approach so filtered photo preview completes within 5 seconds on iPhone 13 mini spec.
- Desired outcome: A consensus-backed plan that can actually satisfy the device SLA or explicitly redefine product/runtime behavior when the current approach cannot.

## Known facts / evidence
- Target app: `toss-plant-growth-miniapp`.
- Current single-camera flow already exists from prior work:
  - `src/components/EnhanceCaptureLab.tsx`
  - save path via `usePlantGrowth().addDailyPhoto`
  - analytics, route parity, TDS mapping updated.
- Current processing pipeline:
  - normalization: `src/camera/processingImage.ts`
  - quality scoring: `src/camera/quality.ts`
  - enhancement: `src/camera/enhancement.ts`
  - plant detection: `src/detection/plantDetector.ts`
- Provided file under investigation: `/Users/jinwoopark/Downloads/IMG_0772.HEIC`
  - metadata observed locally: HEIC, 4032x3024 (shown by `sips`)
- User reports actual processing time on target device class: about 23 seconds on iPhone 13 mini spec.
- Current local benchmark after the latest patch on the exact file:
  - normalized output: 768x1024
  - prep: ~487ms
  - detect: ~33ms
  - quality: ~33ms
  - enhance: ~108ms
  - total: ~660ms
- Current patch downscales oversized non-JPEG normalized images to max dimension 1024 and tests that behavior in `src/camera/processingImage.test.js`.
- Architect verification already rejected treating this as complete for iPhone because HEIC decode still occurs at full resolution before resize.
- Local inspection of `heic-decode` / `libheif-js` shows:
  - decode work is largely synchronous per README
  - the high-level wrapper decodes full image before our resize logic can help
  - the specific HEIC file exposes no embedded thumbnail via low-level thumbnail query (`thumbCount = 0`)

## Constraints
- User requirement is strict: filtered photo processing must complete within 5 seconds on iPhone 13 mini spec.
- Must remain within supported Apps-in-Toss / Granite / RN constraints unless explicitly re-scoped.
- No grounded native fast-path for HEIC has been verified in the current Apps-in-Toss runtime.
- No new dependency without explicit request.
- Preserve user trust and product quality; do not silently degrade in a misleading way.

## Unknowns / open questions
- Whether the 23-second measurement is from the app’s current HEIC path on device after the latest patch or from a prior build.
- Whether product is allowed to redefine support so that HEIC gets raw fallback / JPEG-only filtered preview.
- Whether the platform owner can supply a native HEIC conversion path or guarantee `openCamera` output as JPEG on target devices.

## Likely codebase touchpoints
- `toss-plant-growth-miniapp/src/camera/processingImage.ts`
- `toss-plant-growth-miniapp/src/camera/processingImage.test.js`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.tsx`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.test.js`
- `toss-plant-growth-miniapp/docs/tds-component-mapping.md`
- possibly product/spec docs under `.omx/plans/`

## Working planning inference
- Under the current JS/WASM HEIC decode path, the remaining bottleneck is full-resolution synchronous decode before resize.
- Therefore the likely viable plan options are not “micro-optimize the same HEIC path more,” but rather:
  1. redefine the filtered-preview support contract (JPEG-only / HEIC fallback), or
  2. secure a native/platform fast-path outside currently grounded public support, or
  3. gather target-device verification that disproves the current risk.
