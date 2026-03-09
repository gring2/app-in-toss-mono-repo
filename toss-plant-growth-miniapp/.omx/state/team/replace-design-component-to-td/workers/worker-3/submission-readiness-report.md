# Toss Submission Readiness Report

## 1) Release metadata
- App/project: toss-plant-growth-miniapp
- Candidate version/tag: working-tree (team run `replace-design-component-to-td`)
- Target environment: Apps-in-Toss (sandbox + production readiness check)
- Report date (YYYY-MM-DD): 2026-03-06
- Owner: worker-3

## 2) Console/app registration readiness
- [x] `granite.config.ts` values verified (`appName`, `brand.displayName`, `brand.icon`)
- [x] Deeplink/scheme verified (expected launch route works)
- [x] Required permissions declared and justified
- [ ] App description/category assets ready for submission
- Notes:
  - `granite.config.ts` sets `appName: toss-plant-growth-miniapp`, `scheme: intoss`, `brand.displayName: 오늘의 식물일기`, and non-placeholder icon URL.
  - Only `camera` permission is declared.

## 3) Policy and compliance checks
- [x] Data storage/usage policy matches implementation (local-only vs server)
- [x] Sensitive permission use is minimal and explained
- [ ] User-facing notices/consent flows are present where required
- [x] No prohibited content/pattern detected for Toss miniapp review
- Notes:
  - README policy states local-only storage (`plant-growth-v4`) and no backend sync.
  - Consent/legal screens were not validated in runtime in this worker task; terms files exist but UI linkage not verified.

## 4) Ads and monetization compliance
- [x] Ad placements match UX guardrails from Retention UX Specialist
- [x] Frequency cap/pacing values verified
- [x] Rewarded/interstitial trigger conditions verified
- [x] Ad fallback behavior safe (no hard block/no broken flow)
- Notes:
  - Rewarded ad is tied to capture->compare step and can be skipped.
  - Per-slot/day pacing exists via `shouldShowRewardedAdForSlot` and `markRewardedAdShownForSlot`.
  - **Release blocker:** production rewarded ad id is empty (`src/config/ads.ts`, line 11).

## 5) Product quality evidence
- [ ] Core flow smoke test passed (home/capture/compare/timeline as applicable)
- [x] Empty/loading/error states verified in all new user flows
- [ ] Known edge cases tested and documented
- [ ] Crash/blocker issues: none open for release
- Evidence links (logs/videos/screenshots):
  - Static state coverage evidence:
    - Home loading/empty/onboarding: `src/pages/index.tsx:84-128`
    - Capture error + permission + loading states: `src/pages/capture.tsx:486-591`
    - Compare unavailable/loading/report-loading states: `src/pages/compare.tsx:132-177`, `src/pages/compare.tsx:273-280`
    - Timeline unavailable/loading/end state: `src/pages/timeline.tsx:55-96`, `src/pages/timeline.tsx:151-163`

## 6) Metrics and instrumentation
- [ ] Retention KPIs and guardrails defined (D1/D7, repeat visit)
- [ ] Monetization KPIs and guardrails defined (ARPDAU/ad load impact)
- [ ] Event names/params documented and emitted in key flows
- [ ] Dashboard/query plan prepared for post-release monitoring
- Notes:
  - No analytics/event emission points were identified in user action handlers (`src/pages/index.tsx`, `src/pages/capture.tsx`, `src/pages/compare.tsx`).

## 7) Risks and rollback
- Known risks:
  1. Lint gate currently fails on modified UI/test files (formatting violations).
  2. Production rewarded adGroupId is unset.
  3. Runtime smoke evidence for sandbox device flow is missing.
  4. Retention/monetization instrumentation spec is missing.
- Severity per risk:
  1. High
  2. Medium
  3. High
  4. Medium
- Rollback trigger thresholds:
  - Submission check failure OR lint/type/test/build failure => block release.
  - Capture->compare monetization flow broken/error rate spike in sandbox smoke => rollback candidate.
- Rollback steps:
  1. Revert to previous known-good `.ait` artifact.
  2. Revert ad configuration to prior verified IDs/settings.
  3. Re-run `npm run submission:build` and sandbox smoke before re-submit.
- Owner on rollback:
  - Release owner + miniapp developer on-call

## 8) Final recommendation
- Submission readiness: `NO-GO`
- If `NO-GO`, required fixes:
  1. Resolve lint formatting issues across changed files.
  2. Set and verify production rewarded adGroupId in `src/config/ads.ts`.
  3. Attach sandbox smoke evidence for home/capture/compare/timeline flow.
  4. Add minimal retention/monetization event spec (and implementation or explicit deferral approval).
- Reviewer handoff summary:
  - UI uses Toss/TDS components broadly and key empty/loading/error states are present, but release evidence is incomplete and objective submission gates are not fully satisfied.

---

## Verification (worker-3 execution evidence)
- PASS: `npm run typecheck`
- PASS: `npm run test`
- FAIL: `npx biome check granite.config.ts src/pages src/components src/content src/hooks src/plants src/ads src/config`
  - Biome reported formatting errors in changed files (`src/pages/index.tsx`, `src/pages/capture.tsx`, `src/pages/compare.tsx`, `src/content/copy.ts`, `src/plants/store.ts`, `src/ads/pacing.test.js`, `src/plants/store.slot.test.js`).
- PASS: `npm run build`
- PASS: `npm run submission:check`
