# Ralph Context Snapshot

- task_statement: Improve camera enhancement quality using user-provided normal plant photos and golden set photos.
- desired_outcome: Tune enhancement pipeline against real normal_plant_pic vs golden 식집사 set and ship improved visible camera result.

## known_facts_evidence
- App currently pivoted to minimal flow: take picture -> enhance -> show picture.
- Enhancement pipeline preset exists at `src/camera/enhancement.ts` (`macro_pop_v2`).
- User provided dataset locations:
  - `~/Documents/normal_plant_pic`
  - `~/Documents/식집사`
- Environment currently denies direct access to macOS protected folders from this runtime (`Operation not permitted` on `~/Documents/*`).

## constraints
- Must use provided datasets for tuning as requested.
- Keep local-only behavior.
- Must verify via tests/build and architect review before completion.

## unknowns_open_questions
- Need accessible filesystem path for the two datasets inside current runtime permissions.

## likely_codebase_touchpoints
- `src/camera/enhancement.ts`
- `src/camera/enhancement.test.js`
- new scripts under `scripts/` for dataset evaluation/tuning metrics
