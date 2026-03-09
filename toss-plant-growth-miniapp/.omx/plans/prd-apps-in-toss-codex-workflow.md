# PRD: Apps-in-Toss Codex Workflow Improvement

- Date: 2026-03-07
- Source plan: `.omx/plans/workflow-improvement-plan-2026-03-07.md`
- Owner: Team + Ralph orchestration

## Problem
Workflow handoffs and release evidence are inconsistent, creating risk across retention-safe monetization, TDS compliance, and submission readiness.

## Goals
1. Standardize gate artifacts and handoff format.
2. Enforce release blockers for config mismatch, ad config, and non-TDS usage.
3. Document deterministic ad behavior and slot lifecycle behavior.
4. Improve team/ralph execution clarity for Apps-in-Toss work.

## Non-goals
- Re-architecting entire product features unrelated to workflow reliability.
- Shipping unreviewed UI pattern changes.

## User Stories

### US-001 — Gate Artifacts
As a release owner, I want required gate artifacts documented so that each phase can be audited quickly.
- Acceptance criteria:
  - Workflow RFC and references are discoverable from README/docs.
  - Handoff contract fields are required in workflow docs.

### US-002 — Enforceable Checks
As a submission owner, I want automated checks for config/TDS/ad blockers so that invalid candidates fail fast.
- Acceptance criteria:
  - `submission:check` runs all required blockers including TDS checks.
  - Failing checks return non-zero exit code and clear reason.

### US-003 — Ad Contract Reliability
As a monetization owner, I want explicit ad result states and rollback guardrails so that revenue experiments do not degrade trust.
- Acceptance criteria:
  - Ad behavior contract defines ready/not-ready/failed/dismissed/skip paths.
  - Event tracking fields and rollback triggers are documented.

### US-004 — Slot Lifecycle Hardening
As a developer/reviewer, I want explicit slot behavior and tests so that lifecycle regressions are detected.
- Acceptance criteria:
  - Slot contract aligns with implementation.
  - Tests cover delete/unlock/add and normalization continuity.

### US-005 — Team/Ralph Operating Rhythm
As an engineering team, I want clear role ownership and evidence expectations per gate so that release quality is predictable.
- Acceptance criteria:
  - Gate ownership is explicit.
  - Submission readiness uses mandatory report template.
  - Reviewer gate blocks without checklist evidence.

## Success Metrics / Guardrails
- Release candidate includes complete evidence bundle every time.
- No production candidate with missing adGroupId or config mismatch.
- No newly introduced non-TDS user-facing components in reviewed paths.

## Definition of Done
- PRD/test spec exist and are referenced.
- Workflow docs/scripts/checks are updated per acceptance criteria.
- Verification commands pass: lint, typecheck, test, build, tds:check, submission:check.
