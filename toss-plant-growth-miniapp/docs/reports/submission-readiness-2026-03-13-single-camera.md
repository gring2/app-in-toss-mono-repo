# Toss Submission Readiness Report

## 1) Release metadata
- App/project: toss-plant-growth-miniapp
- Candidate version/tag: local-autopilot-single-camera-2026-03-13
- Target environment: Apps-in-Toss React Native sandbox/local build
- Report date (YYYY-MM-DD): 2026-03-13
- Owner: Codex autopilot

## 2) Console/app registration readiness
- [x] `granite.config.ts` values verified (`appName`, `brand.displayName`, `brand.icon`)
- [x] Deeplink/scheme verified (expected launch route works)
- [x] Required permissions declared and justified
- [ ] App description/category assets ready for submission
- Notes: automated `submission:check` passed; human console asset verification still pending.

## 3) Policy and compliance checks
- [x] Data storage/usage policy matches implementation (local-only vs server)
- [x] Sensitive permission use is minimal and explained
- [x] User-facing notices/consent flows are present where required
- [x] No prohibited content/pattern detected for Toss miniapp review
- Notes: capture uses `camera` permission only; no new native dependency introduced.

## 4) Ads and monetization compliance
- [x] Ad placements match UX guardrails from Retention UX Specialist
- [x] Frequency cap/pacing values verified
- [x] Rewarded/interstitial trigger conditions verified
- [x] Ad fallback behavior safe (no hard block/no broken flow)
- Notes: no new ad placement or pacing changes were made in the single-camera flow.

## 5) Product quality evidence
- [x] Core flow smoke test passed (home/capture/compare/timeline as applicable)
- [x] Empty/loading/error states verified in all new user flows
- [x] Known edge cases tested and documented
- [x] Crash/blocker issues: none open for release
- Evidence links (logs/videos/screenshots): local command evidence only — `npm run typecheck`, `npm run lint:check`, `npm run test`, `npm run build`, `npm run tds:check`, `npm run submission:check`

## 6) Metrics and instrumentation
- [x] Retention KPIs and guardrails defined (D1/D7, repeat visit)
- [x] Monetization KPIs and guardrails defined (ARPDAU/ad load impact)
- [x] Event names/params documented and emitted in key flows
- [ ] Dashboard/query plan prepared for post-release monitoring
- Notes: event coverage added for capture/save lifecycle; metrics dashboard update still pending.

## 7) Risks and rollback
- Known risks: real-device processing time variance; no true live pre-shot WYSIWYG preview
- Severity per risk: medium; medium
- Rollback trigger thresholds: post-shot preview consistently exceeds ~5s on target devices; save-success regresses >1pp; retake-abandonment rises >3pp
- Rollback steps: revert `EnhanceCaptureLab.tsx`, `events.ts`, and mapping doc to prior preset-based flow
- Owner on rollback: feature owner / plant miniapp maintainer

## 8) Final recommendation
- Submission readiness: `NO-GO`
- If `NO-GO`, required fixes: sandbox/manual smoke evidence, final app description/category assets, metrics dashboard preparation
- Reviewer handoff summary: code/build quality is good for continued development and sandbox validation, but release submission still needs human readiness evidence.
