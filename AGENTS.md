# Apps-in-Toss Miniapps Monorepo Rules

This repository is a **monorepo of Apps-in-Toss miniapps**. The root `AGENTS.md` defines **shared rules that apply to every miniapp in this repo** unless a deeper `AGENTS.md` overrides them for a specific app.

Use this file for **general Toss miniapp guidance**. Put product-specific workflow, delivery gates, and app-specific requirements in the relevant app directory.

## Monorepo scope
- Treat each miniapp as an independent product unless the task explicitly spans multiple apps.
- Do not copy one app's product decisions, ad strategy, or storage rules into another app without evidence.
- Prefer touching **one app at a time**. Cross-app edits should be intentional and called out explicitly.
- When a deeper `AGENTS.md` exists inside an app directory, follow the deeper file for that app in addition to this root file.

## Repository shape
Current top-level miniapps currently include (non-exhaustive):
- `toss-plant-growth-miniapp/`
- `toss-todo-miniapp/`

Project-scoped Codex custom subagents live in:
- `.codex/agents/`

## Shared Apps-in-Toss rules

### 1) Granite and app identity must stay coherent
- Keep `granite.config.ts` aligned with the intended app identity.
- `appName`, `brand.displayName`, icons, deeplinks/schemes, and declared permissions must be internally consistent.
- Do not leave placeholder production values in release-oriented changes.
- If console registration details are unknown, mark them clearly instead of guessing.

### 2) Follow Toss-compatible UX patterns
- Prefer Toss-compatible interaction patterns and visual conventions.
- For non-game apps, prefer `@toss/tds-react-native` and existing Granite-compatible patterns.
- Avoid generic mobile patterns that conflict with Toss miniapp expectations.
- Every changed user-facing flow must define **loading**, **empty**, and **error** states.

### 3) Be conservative with permissions, storage, and external integration
- Request the minimum permissions needed.
- Be explicit about data storage behavior: local-only, server-backed, sync behavior, and recovery limitations.
- If the app depends on external APIs, auth, mTLS, firewall rules, or server-side constraints, document and verify those assumptions before shipping.
- Do not introduce new backend or data-sharing assumptions unless the task requires them.

### 4) Monetization must preserve trust
- Do not add ad or monetization behavior that breaks Toss miniapp UX trust.
- Ad changes must include guardrails, trigger conditions, fallback behavior, and rollback criteria.
- Monetization must not hard-block core flows unless the product requirement explicitly allows it.

### 5) Keep changes small and app-scoped
- Prefer small, reviewable, reversible diffs.
- Reuse existing utilities and patterns before introducing new abstractions.
- No new dependencies without clear justification.
- Avoid unrelated refactors when solving an app-specific issue.

### 6) Verification is required
For any changed miniapp, run the relevant verification for that app:
- lint
- typecheck
- tests
- build / bundle generation when relevant
- targeted smoke checks for routes, deeplinks, config, and changed flows

Do not claim completion without fresh evidence from the relevant app.

### 7) Documentation should match behavior
- Update app-local docs only when behavior, constraints, or release steps actually changed.
- Keep shared rules in the root file and app-specific workflow in app directories.
- When handing off work, include:
  - `Context`
  - `Decision`
  - `Output`
  - `Risks`
  - `Next owner`

## Custom subagents
This monorepo includes project-scoped Codex custom subagents in `.codex/agents/`.

Current shared subagents include:
- `retention_ux_specialist`
- `apps_in_toss_monetization_specialist`
- `toss_miniapp_ui_designer`
- `toss_miniapp_developer`
- `toss_submission_readiness_specialist`
- `toss_miniapp_reviewer`
- `awaiter`

Use them as reusable helpers, but keep app-specific requirements in the relevant app scope.

## Generic submission readiness checklist
Use this checklist as the **shared monorepo baseline** for release candidates. App-specific directories may add stricter requirements.

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
- [ ] Submission assets and metadata are ready
- Notes:

## 3) Policy and compliance checks
- [ ] Data storage/usage policy matches implementation
- [ ] Sensitive permission use is minimal and explained
- [ ] User-facing notices/consent flows are present where required
- [ ] No prohibited Toss miniapp pattern is introduced
- Notes:

## 4) Monetization compliance
- [ ] Ad placements or monetization entry points match UX guardrails
- [ ] Frequency/pacing values verified
- [ ] Trigger conditions verified
- [ ] Fallback behavior is safe (no hard block / no broken flow)
- Notes:

## 5) Product quality evidence
- [ ] Core flow smoke test passed
- [ ] Loading/empty/error states verified in changed flows
- [ ] Known edge cases tested and documented
- [ ] No known release-blocking crash or blocker remains open
- Evidence links (logs/videos/screenshots):

## 6) Metrics and instrumentation
- [ ] Product KPIs and guardrails are defined
- [ ] Monetization KPIs and guardrails are defined when applicable
- [ ] Key events and params are documented and emitted
- [ ] Post-release monitoring plan exists
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
