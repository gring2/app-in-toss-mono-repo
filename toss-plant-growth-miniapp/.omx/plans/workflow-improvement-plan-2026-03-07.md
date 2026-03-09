# Workflow Improvement Plan — Apps-in-Toss Miniapp

- Date: 2026-03-07
- Scope: Improve multi-agent workflow quality, reduce rework in ad/TDS/release tasks, and tighten gate evidence.
- Planning mode: `$plan` (direct mode)

## 1) Requirements Summary

Based on this session, we need a workflow that:
1. Prevents configuration mismatches before upload/review.
2. Makes ad behavior deterministic and explicit (no ambiguous fallback behavior).
3. Keeps slot/state behavior aligned with product intent.
4. Enforces TDS-first design/implementation in code review and CI.
5. Produces stronger handoff evidence across existing agent gates.

Grounding references:
- Active roster + mandatory gate sequence: `../AGENTS.md:6-54`
- Guardrails + handoff contract: `../AGENTS.md:55-65`
- Submission readiness checklist (ads, quality, instrumentation, rollback): `../AGENTS.md:67-126`
- Team pipeline in OMX orchestration: `AGENTS.md:236-251`

## 2) Acceptance Criteria (testable)

1. Every release candidate includes an evidence bundle with:
   - console/app config checks,
   - ad path checks,
   - TDS compliance checks,
   - run logs.
2. CI/local release check fails when:
   - appName/deeplink/artifact mismatch exists,
   - production adGroupId is empty,
   - non-TDS UI patterns are introduced.
3. Monetization flows have a documented state table and user-visible behavior for all outcomes:
   - ready / not-ready / failed-to-show / dismissed / skip.
4. Slot lifecycle behavior is explicitly specified and validated by tests.
5. Reviewer gate blocks merge unless handoff contains Context/Decision/Output/Risks/Next owner.

## 3) Implementation Steps

### Phase A — Governance + Artifacts (Day 1)
1. Add a workflow RFC doc (`docs/workflow-rfc.md`) that codifies:
   - required deliverables per gate,
   - handoff template fields from `../AGENTS.md:61-65`,
   - release evidence format.
2. Add ad behavior contract doc (`docs/ad-behavior-contract.md`) with a state table covering all paths.
3. Add slot lifecycle contract doc (`docs/slot-lifecycle-contract.md`) including delete/unlock/add semantics.

### Phase B — Enforceable Checks (Day 1–2)
1. Extend submission check pipeline to include TDS guardrail script.
   - Existing submission checks: `scripts/validate-submission.sh:1-61`
   - Existing TDS checks: `scripts/check-tds-usage.sh:1-55`
   - Action: invoke `bash scripts/check-tds-usage.sh` inside submission check.
2. Keep ad config checks in submission script as hard blockers.
   - Current ad config checks: `scripts/validate-submission.sh:45-46`
3. Add a light “release evidence” script (`scripts/collect-release-evidence.sh`) to output:
   - command statuses,
   - artifact timestamp,
   - key screenshots/log links placeholder.

### Phase C — Flow Reliability (Day 2–3)
1. Refactor ad flow into a dedicated service module (`src/ads/service.ts`) that returns explicit result enums.
   - Current capture flow coupling hotspot: `src/pages/capture.tsx:360-458`, `src/pages/capture.tsx:515-568`
   - Ad environment/config source: `src/config/ads.ts:1-52`
2. Keep UI page-level logic focused on rendering and CTA transitions only.
3. Add event instrumentation spec + implementation checklist for ad transitions.

### Phase D — State Model Hardening (Day 3)
1. Keep slot lifecycle behavior contract aligned with implementation and tests.
   - Current slot logic: `src/plants/store.ts:724-852`
2. Expand tests to cover:
   - delete from N slots,
   - min slot floor,
   - unlock/add sequence,
   - slot key normalization continuity.

### Phase E — Agent Operating Rhythm (Day 3–4)
1. Make gate ownership explicit in PR template:
   - Spec Gate owner: Retention + Monetization specialists
   - Design Gate owner: UI Designer
   - Build Gate owner: Developer + Test Engineer
   - Submission Readiness Gate owner: Submission Specialist
   - Review Gate owner: Miniapp Reviewer
   - Run Gate owner: Awaiter
2. Require each handoff to include metric expectation and rollback trigger references.
3. Enforce single merge gate with reviewer checklist and evidence links.

## 4) Risks and Mitigations

1. **Risk:** More process slows delivery.
   - **Mitigation:** Keep artifacts short templates, automate checks in scripts.
2. **Risk:** Ad behavior still diverges by environment.
   - **Mitigation:** service-level result enums + environment matrix verification.
3. **Risk:** TDS checks create false positives.
   - **Mitigation:** maintain explicit allowlist for layout/media wrappers and update script iteratively.

## 5) Verification Steps

Run on every release candidate:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run tds:check`
6. `npm run submission:check`

Evidence expectations:
- command output logs,
- release artifact name + timestamp,
- submission readiness report using template in `../AGENTS.md:67-126`.

## 6) Suggested Owner Assignment

- Workflow docs + templates: `Toss Submission Readiness Specialist`
- Ad behavior contract + pacing/rollback: `Apps-in-Toss Monetization Specialist`
- TDS mapping + UI state tables: `Toss Miniapp UI Designer`
- Script integration + code changes + tests: `toss_miniapp_developer`
- Merge gate enforcement: `toss_miniapp_reviewer`
- Run logs and final pass/fail: `awaiter`

## 7) Definition of Done

This workflow improvement is complete when:
1. All new docs/templates exist and are referenced from README or AGENTS flow docs.
2. Submission check includes TDS check and fails correctly on violations.
3. Ad flow contract and slot contract are implemented and tested.
4. One full dry-run release candidate passes all gates with evidence attached.
