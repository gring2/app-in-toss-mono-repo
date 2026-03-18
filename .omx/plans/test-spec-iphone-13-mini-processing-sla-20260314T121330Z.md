# Test Spec — iPhone 13 mini 5-Second Processing SLA

- Project: toss-plant-growth-miniapp
- Date: 2026-03-14

## A. Objective
Verify that the supported filtered-preview path completes within 5 seconds on iPhone 13 mini, and that HEIC follows a safe fast fallback path rather than a 20+ second processing experience.

## B. Unit tests
1. `src/camera/processingImage.test.js`
   - HEIC is identified correctly
   - oversized HEIC normalization remains capped
   - HEIC fallback decision logic is covered
   - HEIC fallback path is reachable from cheap mime/header detection without requiring full HEIC decode
2. `src/components/EnhanceCaptureLab.test.js`
   - JPEG/supported path renders filtered preview flow
   - HEIC/unsupported-slow path renders fallback guidance instead of long filtered-preview wait
3. `src/analytics/events.test.js`
   - fallback / source-path events remain structured

## C. Manual/device verification (mandatory)
Target device: **iPhone 13 mini**

For each sample, record start-to-preview time:
1. JPEG / High Compatibility capture
   - expected: filtered preview <= 5.0s
2. HEIC capture
   - expected: no prolonged 20+ second blocked processing path
   - expected: fast fallback guidance or explicitly unsupported filtered-preview behavior
   - expected: fallback occurs immediately after capture classification, not after a long HEIC processing attempt
3. Repeat 3-5 times under realistic lighting
4. Record average, slowest, and failure cases

## D. Release gate
- Release cannot claim SLA compliance without iPhone 13 mini evidence
- If JPEG path exceeds 5 seconds, SLA is failed
- If HEIC path still blocks the user for ~20 seconds, fallback is missing/incorrect and release is blocked
- If HEIC fallback still depends on full HEIC decode before the decision, release is blocked

## E. Commands
- `cd toss-plant-growth-miniapp && npm run typecheck`
- `cd toss-plant-growth-miniapp && npm run lint:check`
- `cd toss-plant-growth-miniapp && npm run test`
- `cd toss-plant-growth-miniapp && npm run build`

## F. Exit criteria
- All commands pass
- iPhone 13 mini evidence exists for the supported filtered-preview path
- HEIC no longer causes a 20+ second blocking experience
- Reviewer signs off that the SLA claim matches the actual supported path
