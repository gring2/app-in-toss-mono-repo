---
name: "pm-marketplace"
description: "Route PM Skills Marketplace requests in Codex. Use when you want help choosing the right discovery, strategy, research, execution, growth, analytics, or toolkit workflow, or when you want a Codex equivalent of a Claude PM slash command."
---

# PM Skills Marketplace for Codex

This hub skill helps choose between the imported PM skills and the converted workflow-wrapper skills.
Use a wrapper when you want the end-to-end workflow that originally lived behind a Claude slash command.
Use the underlying imported skill when you want a focused framework or document template.

## Wrapper naming convention
- Every converted Claude command is available as `$pm-workflow-<command-name>`.
- Example: Claude `/discover` → Codex `$pm-workflow-discover`.

## Best-effort routing rules
- If the user asks for a complete workflow, prefer the matching `$pm-workflow-*` skill.
- If the user asks for a specific framework (for example PRD, SWOT, opportunity-solution-tree, cohort analysis), prefer the matching imported skill directly.
- If the request is ambiguous, propose 2-3 likely workflow options and continue with the best match.

## Available Codex workflow wrappers

### pm-data-analytics
- `/analyze-cohorts` → `$pm-workflow-analyze-cohorts`
- `/analyze-test` → `$pm-workflow-analyze-test`
- `/write-query` → `$pm-workflow-write-query`

### pm-execution
- `/generate-data` → `$pm-workflow-generate-data`
- `/meeting-notes` → `$pm-workflow-meeting-notes`
- `/plan-okrs` → `$pm-workflow-plan-okrs`
- `/pre-mortem` → `$pm-workflow-pre-mortem`
- `/sprint` → `$pm-workflow-sprint`
- `/stakeholder-map` → `$pm-workflow-stakeholder-map`
- `/test-scenarios` → `$pm-workflow-test-scenarios`
- `/transform-roadmap` → `$pm-workflow-transform-roadmap`
- `/write-prd` → `$pm-workflow-write-prd`
- `/write-stories` → `$pm-workflow-write-stories`

### pm-go-to-market
- `/battlecard` → `$pm-workflow-battlecard`
- `/growth-strategy` → `$pm-workflow-growth-strategy`
- `/plan-launch` → `$pm-workflow-plan-launch`

### pm-market-research
- `/analyze-feedback` → `$pm-workflow-analyze-feedback`
- `/competitive-analysis` → `$pm-workflow-competitive-analysis`
- `/research-users` → `$pm-workflow-research-users`

### pm-marketing-growth
- `/market-product` → `$pm-workflow-market-product`
- `/north-star` → `$pm-workflow-north-star`

### pm-product-discovery
- `/brainstorm` → `$pm-workflow-brainstorm`
- `/discover` → `$pm-workflow-discover`
- `/interview` → `$pm-workflow-interview`
- `/setup-metrics` → `$pm-workflow-setup-metrics`
- `/triage-requests` → `$pm-workflow-triage-requests`

### pm-product-strategy
- `/business-model` → `$pm-workflow-business-model`
- `/market-scan` → `$pm-workflow-market-scan`
- `/pricing` → `$pm-workflow-pricing`
- `/strategy` → `$pm-workflow-strategy`
- `/value-proposition` → `$pm-workflow-value-proposition`

### pm-toolkit
- `/draft-nda` → `$pm-workflow-draft-nda`
- `/privacy-policy` → `$pm-workflow-privacy-policy`
- `/proofread` → `$pm-workflow-proofread`
- `/review-resume` → `$pm-workflow-review-resume`
- `/tailor-resume` → `$pm-workflow-tailor-resume`

## High-signal starting points
- New idea or feature discovery: `$pm-workflow-discover`
- Product strategy: `$pm-workflow-strategy`
- PRD writing: `$pm-workflow-write-prd` or `$create-prd`
- Launch planning: `$pm-workflow-plan-launch`
- North Star metrics: `$pm-workflow-north-star`
- User research synthesis: `$pm-workflow-research-users` or `$pm-workflow-interview`
- Pricing strategy: `$pm-workflow-pricing`
- Growth strategy: `$pm-workflow-growth-strategy`

## Notes
- Upstream universal skills were imported with their original names and descriptions.
- The original Claude commands were converted into Codex skills with a `pm-workflow-` prefix to avoid collisions.
- If a workflow references another skill, assume that skill is installed in the same `.codex/skills/` directory.
