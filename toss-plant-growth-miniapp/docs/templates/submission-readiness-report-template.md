# Toss Submission Readiness Report

## 1) Release metadata
- App/project:
- Candidate version/tag:
- Target environment:
- Report date (YYYY-MM-DD):
- Owner:

## 2) Console/app registration readiness
- [ ] `granite.config.ts` values verified (`appName`, `brand.displayName`, `brand.icon`)
- [ ] Deeplink/scheme verified (expected launch route works)
- [ ] Required permissions declared and justified
- [ ] App description/category assets ready for submission
- Notes:

## 3) Policy and compliance checks
- [ ] Data storage/usage policy matches implementation (local-only vs server)
- [ ] Sensitive permission use is minimal and explained
- [ ] User-facing notices/consent flows are present where required
- [ ] No prohibited content/pattern detected for Toss miniapp review
- Notes:

## 4) Ads and monetization compliance
- [ ] Ad placements match UX guardrails from Retention UX Specialist
- [ ] Frequency cap/pacing values verified
- [ ] Rewarded/interstitial trigger conditions verified
- [ ] Ad fallback behavior safe (no hard block/no broken flow)
- Notes:

## 5) Product quality evidence
- [ ] Core flow smoke test passed (home/capture/compare/timeline as applicable)
- [ ] Empty/loading/error states verified in all new user flows
- [ ] Known edge cases tested and documented
- [ ] Crash/blocker issues: none open for release
- Evidence links (logs/videos/screenshots):

## 6) Metrics and instrumentation
- [ ] Retention KPIs and guardrails defined (D1/D7, repeat visit)
- [ ] Monetization KPIs and guardrails defined (ARPDAU/ad load impact)
- [ ] Event names/params documented and emitted in key flows
- [ ] Dashboard/query plan prepared for post-release monitoring
- Notes:

## 7) Risks and rollback
- Known risks:
- Severity per risk:
- Rollback trigger thresholds:
- Rollback steps:
- Owner on rollback:

## 8) Final recommendation
- Submission readiness: `GO` | `NO-GO`
- If `NO-GO`, required fixes:
- Reviewer handoff summary:
