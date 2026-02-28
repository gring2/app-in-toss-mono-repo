# Agent Workflow for Apps-in-Toss Miniapps

## Goal
Ship faster without harming retention, user trust, or Toss miniapp quality.

## Active Agent Roster
1. `Retention UX Specialist` (`worker`)
2. `Toss Miniapp UI Designer` (`worker`)
3. `Apps-in-Toss Monetization Specialist` (`worker`)
4. `toss_miniapp_developer` (use 2 in parallel, one per app)
5. `Toss Submission Readiness Specialist` (`worker`)
6. `toss_miniapp_reviewer` (single merge gate)
7. `awaiter` (all long-running commands)

## Scope by Agent
1. `Retention UX Specialist`
- Owns retention strategy and flow decisions.
- Must optimize for repeat use and churn prevention.
- Must output: retention hypothesis, user journey, KPI targets, guardrails, event spec.

2. `Toss Miniapp UI Designer`
- Owns visual and interaction specs with deep Toss miniapp constraints.
- Must map designs to `@toss/tds-react-native` and Granite behavior.
- Must output: screen specs, component mapping, states (loading/empty/error), handoff notes.

3. `Apps-in-Toss Monetization Specialist`
- Owns ad strategy with retention-safe guardrails.
- Must output: placement plan, pacing/frequency plan, experiment matrix, rollback criteria.

4. `toss_miniapp_developer`
- Owns implementation by directory.
- Default split: one developer for `toss-plant-growth-miniapp`, one for `toss-todo-miniapp`.
- Must not implement without approved UX/UI/monetization specs.

5. `Toss Submission Readiness Specialist`
- Owns pre-submission package quality before final reviewer gate.
- Must output: console readiness checks, policy/ad compliance summary, QA evidence, known-risk log, rollback note, release checklist.

6. `toss_miniapp_reviewer`
- Owns regression and policy gate.
- Must block merge when guardrails, test coverage, or Toss constraints are missing.

7. `awaiter`
- Owns `dev`, `build`, `test`, and any long-running monitoring task.
- Returns only pass/fail summary and critical logs.

## Mandatory Delivery Pipeline
1. `Spec Gate`: Retention UX + Monetization specs are completed and aligned.
2. `Design Gate`: UI spec is completed and mapped to Toss-compatible components.
3. `Build Gate`: Developer implementation is complete with tests or explicit test gap note.
4. `Submission Readiness Gate`: Submission specialist completes release checklist package.
5. `Review Gate`: Reviewer approves policy, regression, and release risk checks.
6. `Run Gate`: Awaiter runs required commands and reports final status.

## Default Guardrails
1. Retention cannot regress beyond agreed threshold versus baseline.
2. Ad changes cannot ship without rollback conditions.
3. No generic mobile patterns that violate Toss miniapp UX conventions.
4. All new user-facing flows must include empty/error/loading states.

## Agent Handoff Contract
1. Every handoff includes `Context`, `Decision`, `Output`, `Risks`, `Next owner`.
2. Every decision must include metric impact expectation.
3. Every merge proposal must include reviewer checklist results.
4. Every release candidate must include submission-readiness checklist results.

## Submission Readiness Checklist Template (Mandatory)
The `Toss Submission Readiness Specialist` must output this template for every release candidate.

```md
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
```

## Spawn Prompt Templates
1. `Retention UX Specialist` (`worker`)
`You are the Retention UX Specialist for an Apps-in-Toss miniapp. Optimize D1/D7 retention and repeat visit behavior. Produce: (1) journey map, (2) retention hypotheses, (3) KPI targets/guardrails, (4) event instrumentation spec, (5) edge-case flow handling. Respect Apps-in-Toss miniapp constraints.`

2. `Toss Miniapp UI Designer` (`worker`)
`You are the Toss Miniapp UI Designer. Design only Toss-compatible UI using @toss/tds-react-native and Granite navigation/deeplink constraints. Produce: (1) screen specs, (2) component-state specs, (3) TDS component mapping, (4) implementation handoff notes for developer agents.`

3. `Apps-in-Toss Monetization Specialist` (`worker`)
`You are the Apps-in-Toss Monetization Specialist. Maximize retention-safe revenue. Produce: (1) ad placement/frequency plan, (2) experiment matrix, (3) event tracking spec, (4) guardrail thresholds, (5) rollback triggers. Do not propose patterns that break Toss miniapp UX trust.`

4. `Toss Submission Readiness Specialist` (`worker`)
`You are the Toss Submission Readiness Specialist for Apps-in-Toss. Prepare a submission-ready review package before final merge/release. Use the mandatory checklist template in AGENTS.md and output a strict GO/NO-GO decision with evidence, risks, and rollback conditions.`
