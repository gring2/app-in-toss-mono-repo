# Context Snapshot — custom-plant-camera-redesign

- Timestamp (UTC): 2026-03-13T12:52:43Z
- Task statement: Create a consensus plan for a new custom camera design in the plant-growth miniapp, with a plant-specialized filter, while keeping photo quality at least as good as the previous work.
- Desired outcome: A build-ready plan that clarifies product scope, design approach, technical feasibility in Apps-in-Toss, quality-preservation strategy, testing, staffing, and rollout.

## Known facts / evidence
- Target app is `toss-plant-growth-miniapp`.
- Current capture route is `src/pages/capture.tsx`, which renders `src/components/EnhanceCaptureLab.tsx`.
- Current capture UX is a custom pre-capture shell plus Apps-in-Toss `openCamera` handoff to the system camera.
- Current processing stack already contains plant-specific logic:
  - presets: `src/camera/presets.ts`
  - quality scoring: `src/camera/quality.ts`
  - enhancement/filter pipeline: `src/camera/enhancement.ts`
  - image prep/normalization: `src/camera/processingImage.ts`, `src/plants/image.ts`
  - plant detection: `src/detection/plantDetector.ts`
- Product pivot source of truth (`docs/product-pivot-2026-03-11.md`) says the app should optimize for taking a good photo of today's plant and noticing current detail/condition.
- TDS UI contract (`docs/tds-ui-contract.md`) requires TDS for visible controls and explicit loading/empty/error states.
- TDS mapping doc currently states capture uses a custom preview shell around `openCamera` because Apps-in-Toss `openCamera` opens the system camera.
- Official Apps-in-Toss docs retrieved on 2026-03-13 show `openCamera(options)` is the documented camera API for React Native and it launches the camera and returns an image response; permission is declared via `granite.config.ts` with `camera/access`.
- Local SDK source inspection under `node_modules/@apps-in-toss` shows camera-related exports centered on `openCamera`; no obvious live custom preview camera API was found.

## Constraints
- Must follow Apps-in-Toss React Native + Granite + TDS constraints.
- No new dependency without explicit request.
- Must preserve or improve current capture quality behavior relative to existing scoring/enhancement pipeline.
- Must keep user trust and retention guardrails.
- Must include loading/empty/error states for any new flow.
- Likely needs to stay compatible with current local-only storage model and current plant diary product direction.

## Unknowns / open questions
- Whether the user wants a true in-app live custom camera preview, or a redesigned pre-capture/post-capture flow around the existing system camera handoff.
- Whether new design should replace all three current presets (`diary`, `detail`, `whole`) or collapse them into a simplified plant-first mode.
- Which current quality metrics are considered the “previous work” baseline for acceptance (e.g. score thresholds, image max width, enhancement version, subjective QA).
- Whether release scope should include compare/timeline copy cleanup or be limited to capture flow only.

## Likely codebase touchpoints
- `toss-plant-growth-miniapp/src/pages/capture.tsx`
- `toss-plant-growth-miniapp/src/components/EnhanceCaptureLab.tsx`
- `toss-plant-growth-miniapp/src/camera/presets.ts`
- `toss-plant-growth-miniapp/src/camera/quality.ts`
- `toss-plant-growth-miniapp/src/camera/enhancement.ts`
- `toss-plant-growth-miniapp/src/components/captureExperienceCopy.ts`
- `toss-plant-growth-miniapp/docs/tds-component-mapping.md`
- `toss-plant-growth-miniapp/docs/product-pivot-2026-03-11.md` (reference)

## Working assumption for planning
- Because official/current local evidence only confirms `openCamera` (system camera launch), the safest default plan is to redesign the custom capture experience around the handoff and preserve the existing quality/enhancement engine, while explicitly calling out a feasibility spike if a true live custom preview is still desired.
