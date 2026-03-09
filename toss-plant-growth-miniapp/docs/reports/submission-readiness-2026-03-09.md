# Toss Submission Readiness Report

## 1) Release metadata
- App/project: toss-plant-growth-miniapp (`plant-growth-miniapp`)
- Candidate version/tag: `sdk2.0.1-migration-local-20260309`
- Target environment: Apps-in-Toss (production submission candidate)
- Report date (YYYY-MM-DD): 2026-03-09
- Owner: Codex (Toss Submission Readiness Specialist run)

## 2) Console/app registration readiness
- [x] `granite.config.ts` values verified (`appName`, `brand.displayName`, `brand.icon`)
- [x] Deeplink/scheme verified (expected launch route works)
- [x] Required permissions declared and justified
- [x] App description/category assets ready for submission
- Notes:
  - `granite.config.ts` shows `appName: plant-growth-miniapp`, scheme `intoss`, displayName set, production icon URL set.
  - Permission is limited to `camera` and aligns with capture flow.
  - SDK migration applied: `@apps-in-toss/framework@2.0.1`, React 19.2.3, RN 0.84.0, Granite 1.0.4 line.
  - Runtime deeplink launch validation completed in sandbox (owner-confirmed).
  - Submission metadata assets (description/category/screenshots) marked ready by owner.

## 3) Policy and compliance checks
- [x] Data storage/usage policy matches implementation (local-only vs server)
- [x] Sensitive permission use is minimal and explained
- [x] User-facing notices/consent flows are present where required
- [x] No prohibited content/pattern detected for Toss miniapp review
- Notes:
  - Local-only storage policy documented in README and no network calls detected in `src/`/`pages/`.
  - Permission denial/reopen UX exists in capture flow.

## 4) Ads and monetization compliance
- [x] Ad placements match UX guardrails from Retention UX Specialist
- [x] Frequency cap/pacing values verified
- [x] Rewarded/interstitial trigger conditions verified
- [x] Ad fallback behavior safe (no hard block/no broken flow)
- Notes:
  - Capture-only rewarded path + explicit skip path + slot/date pacing.
  - Timeout-safe fallback implemented and covered by tests (`src/ads/service.test.js`).

## 5) Product quality evidence
- [x] Core flow smoke test passed (home/capture/compare/timeline as applicable)
- [x] Empty/loading/error states verified in all new user flows
- [x] Known edge cases tested and documented
- [x] Crash/blocker issues: none open for release
- Evidence links (logs/videos/screenshots):
  - Automated release evidence: `.omx/reports/release-evidence-20260309T132703Z/report.md`
  - Build/test/typecheck/tds/submission check logs: `.omx/reports/release-evidence-20260309T132703Z/logs/`
  - Fresh gate rerun: `npm run submission:build` passed on 2026-03-09 (KST)
  - Sandbox smoke record: `docs/reports/sandbox-smoke-test-2026-03-09.md`

## 6) Metrics and instrumentation
- [x] Retention KPIs and guardrails defined (D1/D7, repeat visit)
- [x] Monetization KPIs and guardrails defined (ARPDAU/ad load impact)
- [x] Event names/params documented and emitted in key flows
- [x] Dashboard/query plan prepared for post-release monitoring
- Notes:
  - Event taxonomy + params documented in `docs/ad-behavior-contract.md`.
  - Event emission implemented in `src/pages/capture.tsx` via `src/analytics/events.ts`.
  - Monitoring/query plan prepared: `docs/metrics-dashboard-plan.md`.

## 7) Risks and rollback
- Known risks:
  - No open blocker for submission; monitor post-release ad-failure ratio.
- Severity per risk:
  - Operational monitoring risk: Medium
- Rollback trigger thresholds:
  - Submission review rejection due missing runtime evidence.
  - Post-release crash/blocking UX or ad-flow stuck incidents.
- Rollback steps:
  1. Halt rollout / withdraw candidate in Toss console.
  2. Revert to prior known-good `.ait` artifact.
  3. Re-run `npm run submission:build` + `npm run submission:evidence` after fixes.
- Owner on rollback:
  - toss_miniapp_developer + Toss Submission Readiness Specialist

## 8) Final recommendation
- Submission readiness: `GO`
- If `NO-GO`, required fixes:
  - N/A
- Reviewer handoff summary:
  - SDK 2.0.1 migration and release gates are green.
  - Manual sandbox smoke and console metadata readiness were confirmed by owner.
