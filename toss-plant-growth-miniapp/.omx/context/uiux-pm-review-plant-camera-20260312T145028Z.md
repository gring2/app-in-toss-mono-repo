# OMX Context Snapshot — UI/UX + PM review of plant camera app

- task_statement: Review the current plant camera miniapp with UI/UX and PM lenses, iterate improvements, and continue until reviewer agrees the app is OK.
- desired_outcome: Improve the app's user-perceived clarity, speed, theme, and product positioning while staying inside current Apps-in-Toss camera constraints.

## known_facts_evidence
- Current app uses `openCamera({ base64: true, maxWidth: 1280 })` as the actual capture backend.
- Current app already has a themed plant-camera shell (`EnhanceCaptureLab`) with presets.
- SDK docs found no official live custom camera preview/theme/filter API beyond `openCamera`.
- Current implementation recently added format normalization, runtime Buffer polyfill, and enhancement diagnostics.
- User now wants a UI/UX + PM review workflow and iterative improvement until reviewer agreement.

## constraints
- Keep Apps-in-Toss / Granite compatibility.
- Preserve local-only behavior.
- Do not depend on undocumented custom live camera controls.
- Prefer small, reviewable improvements that can be verified with tests/build.

## unknowns_open_questions
- Which specific UX/product refinements will reviewers judge highest impact.
- Whether reviewer will accept current themed wrapper model without further camera-flow simplification.

## likely_codebase_touchpoints
- `src/components/EnhanceCaptureLab.tsx`
- `src/camera/presets.ts`
- `src/camera/enhancement.ts`
- `src/content/copy.ts`
- routes under `src/pages/*`
