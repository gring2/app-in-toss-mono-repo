# Test Spec: Apps-in-Toss Codex Workflow Improvement

- Date: 2026-03-07
- Linked PRD: `.omx/plans/prd-apps-in-toss-codex-workflow.md`

## Verification Matrix

1. Documentation completeness
- Check: workflow docs reference gate sequence and handoff contract fields.
- Evidence: file paths + snippet proof in final report.

2. Submission blockers
- Command: `npm run submission:check`
- Expected: passes only when config/ad/TDS blockers are satisfied.
- Failure expectation: non-zero + actionable error when mismatch exists.

3. Quality baseline
- Commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Expected: all commands succeed on release candidate branch.

4. TDS guardrail
- Command: `npm run tds:check`
- Expected: no forbidden non-TDS usage in scoped code.

5. Slot lifecycle behavior
- Command: `npm run test -- src/plants/store.slot.test.js`
- Expected: delete/unlock/add lifecycle tests pass.

6. Ad behavior safety
- Check: ad behavior contract + event spec + fallback behavior documented.
- Evidence: docs references + test/log confirmation where applicable.

## Exit Criteria
All checks above pass and evidence bundle is attached in submission readiness report.
