# Workflow RFC — Apps-in-Toss Miniapp Delivery

## Purpose
Define a repeatable, evidence-first workflow that reduces rework for config, ads, TDS UI, and release readiness.

## Scope
- Applies to `toss-plant-growth-miniapp` delivery workflow.
- Aligns with the project-scoped custom subagents defined in `../AGENTS.md`.
- Uses canonical templates from `docs/templates/`.

## Delivery Gates and Required Outputs

### 1) Spec Gate
**Owners:** `retention_ux_specialist` + `apps_in_toss_monetization_specialist`  
**Required outputs:**
- Retention hypothesis, KPI targets, guardrails
- Monetization plan (placement/pacing/frequency)
- Ad rollback triggers + thresholds
- Event instrumentation spec

### 2) Design Gate
**Owner:** `toss_miniapp_ui_designer`  
**Required outputs:**
- TDS component mapping (`docs/tds-component-mapping.md`)
- Screen states (loading/empty/error)
- Toss constraints and interaction notes

### 3) Build Gate
**Owner:** `toss_miniapp_developer`  
**Required outputs:**
- Minimal implementation diff tied to approved specs
- Tests or explicit test-gap note
- Behavior contracts updated for changed flows

### 4) Submission Readiness Gate
**Owner:** `toss_submission_readiness_specialist`  
**Required outputs:**
- Mandatory report from `../AGENTS.md`
- Release evidence bundle (commands, logs, artifact, risk/rollback notes)

### 5) Review Gate
**Owner:** `toss_miniapp_reviewer`  
**Required outputs:**
- Regression + policy review verdict
- Checklist pass/fail with blocking reasons

### 6) Run Gate
**Owner:** `awaiter`  
**Required outputs:**
- Command pass/fail summary
- Critical logs only

## Handoff Contract (Mandatory)
Every handoff must include:
1. Context
2. Decision
3. Output
4. Risks
5. Next owner

Additionally:
- Include expected metric impact.
- Include rollback condition references for ad/monetization changes.
- Use template: `docs/templates/handoff-template.md`

## Release Evidence Bundle
Each release candidate should attach:
1. Command results (`lint:check`, `typecheck`, `test`, `build`, `tds:check`, `submission:check`)
2. `.ait` artifact name and timestamp
3. App config evidence (`appName`, deeplink, permissions)
4. Ad behavior evidence (ready/not-ready/failed/dismissed/skip paths)
5. Metrics/dashboard query plan (`docs/metrics-dashboard-plan.md`)
6. Known risks and rollback steps

Use:
- `npm run submission:evidence`
- Template: `docs/templates/submission-readiness-report-template.md`

## Quality Gates (Blocking)
Release is blocked if any of these fail:
- `granite.config.ts` and console appName mismatch
- Production adGroupId missing or empty
- TDS contract violation
- Missing loading/empty/error states in changed flows
- Missing handoff contract fields

## Operating Notes
- Keep docs concise and update only impacted sections.
- Prefer automated checks over manual checklist-only validation.
- Reviewer enforces gate integrity; no bypass on “almost ready.”
