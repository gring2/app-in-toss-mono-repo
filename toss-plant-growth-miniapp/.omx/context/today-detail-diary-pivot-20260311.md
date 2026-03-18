# OMX Context Snapshot — Today's Detail Diary Pivot

- date: 2026-03-11
- status: active pivot context for upcoming plant miniapp work
- supersedes_product_framing: `.omx/context/local-macro-camera-implementation-20260309T174715Z.md`

## task_statement
Pivot the plant miniapp toward a photo-library and diary experience focused on the details of today's plant, not on measuring change between today and previous photos.

## desired_outcome
- Help users take a good photo of today's plant
- Help users notice current detail and condition
- Make daily use feel like a lightweight diary habit
- Keep local-only storage and Toss miniapp compatibility

## known_facts_evidence
- Current documentation and implementation still heavily reference compare/report/growth framing.
- Current user intent is to move away from “store and compare today to previous photos” as the primary narrative.
- Camera work is continuing in a separate session and should inherit this new framing.
- Existing compare/timeline/report surfaces may still remain temporarily in code.

## constraints
- Local-only data handling; no backend sync in this version
- Preserve Toss miniapp compatibility and existing routing until follow-up product work lands
- Avoid positioning ads or compare-report flow as the main product promise
- Do not assume monetization direction is settled

## preferred_product_language
- today's plant
- today's record
- diary
- detail
- current condition
- good photo
- photo library / archive

## de_emphasized_language
- growth report
- change score
- comparison-first
- baseline comparison
- growth album

## likely_codebase_touchpoints_for_followup
- `src/pages/index.tsx`
- `src/pages/capture.tsx`
- `src/pages/compare.tsx`
- `src/pages/timeline.tsx`
- `src/content/copy.ts`
- `src/analytics/events.ts`

## open_followups
- Redesign compare/report copy and structure around diary/detail-first language
- Decide whether timeline becomes a fuller photo library surface
- Define the new analytics spec for diary-first behavior
- Revisit monetization only after the new core flow is stable
