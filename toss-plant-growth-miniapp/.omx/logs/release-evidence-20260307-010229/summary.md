# Release Evidence Summary
- Timestamp: 2026-03-07T01:02:29.219320+09:00
- Worker: worker-3

## Lint scope (modified files)
affected files: README.md granite.config.ts package-lock.json package.json src/_app.tsx src/ads/pacing.ts src/components/CompareSlider.tsx src/content/copy.ts src/hooks/usePlantGrowth.ts src/pages/capture.tsx src/pages/compare.tsx src/pages/index.tsx src/pages/timeline.tsx src/plants/store.ts src/router.gen.ts AD_SLOT_TEST_CASES.md AGENTS.md SUBMISSION_CHECKLIST.md TERMS_OF_SERVICE.ko.md TERMS_REGISTRATION.md src/ads/pacing.test.js src/plants/store.slot.test.js

## lint_modified
- command:
```bash
npx biome check README.md granite.config.ts package-lock.json package.json src/_app.tsx src/ads/pacing.ts src/components/CompareSlider.tsx src/content/copy.ts src/hooks/usePlantGrowth.ts src/pages/capture.tsx src/pages/compare.tsx src/pages/index.tsx src/pages/timeline.tsx src/plants/store.ts src/router.gen.ts AD_SLOT_TEST_CASES.md AGENTS.md SUBMISSION_CHECKLIST.md TERMS_OF_SERVICE.ko.md TERMS_REGISTRATION.md src/ads/pacing.test.js src/plants/store.slot.test.js
```
- status: FAIL
- exit_code: 1
- log: .omx/logs/release-evidence-20260307-010229/lint_modified.log

## typecheck
- command:
```bash
npm run typecheck
```
- status: PASS
- exit_code: 0
- log: .omx/logs/release-evidence-20260307-010229/typecheck.log

## test
- command:
```bash
npm run test
```
- status: PASS
- exit_code: 0
- log: .omx/logs/release-evidence-20260307-010229/test.log

## build
- command:
```bash
npm run build
```
- status: PASS
- exit_code: 0
- log: .omx/logs/release-evidence-20260307-010229/build.log

## tds_check
- command:
```bash
npm run tds:check
```
- status: FAIL
- exit_code: 1
- log: .omx/logs/release-evidence-20260307-010229/tds_check.log

## submission_check
- command:
```bash
npm run submission:check
```
- status: PASS
- exit_code: 0
- log: .omx/logs/release-evidence-20260307-010229/submission_check.log

## Totals
- PASS: 4
- FAIL: 2
