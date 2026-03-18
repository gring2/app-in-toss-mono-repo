---
name: "pm-workflow-privacy-policy"
description: "Draft a privacy policy covering data collection, usage, storage, and compliance requirements in Codex. Codex wrapper for Claude's /privacy-policy command."
---

# PM Workflow: Privacy Policy

This skill is the Codex conversion of Claude's `/privacy-policy` command from the PM Skills Marketplace.
It preserves the original workflow and underlying PM frameworks, but packages them as a Codex skill instead of a slash command.

## Codex Usage
- Recommended invocation: `$pm-workflow-privacy-policy <product and data handling context>`
- Original Claude argument hint: `<product and data handling context>`
- Source plugin: `pm-toolkit`
- Original Claude command: `/privacy-policy`

## Execution Guidance
- Ask only for the minimum missing context needed to continue.
- If the user already provided enough context, skip the interview-style questions and produce the workflow output directly.
- Reuse the imported PM skills referenced below whenever they fit the task.
- Save substantial deliverables as markdown files when helpful.

## Upstream Workflow
## Privacy Policy Generator

Draft a comprehensive privacy policy for your product. Covers data types, jurisdiction, compliance (GDPR, CCPA), and marks clauses needing legal review.

## Invocation

```
/privacy-policy SaaS analytics tool that collects user behavior data — serving US and EU customers
/privacy-policy Mobile app with location data and third-party integrations
```

## Workflow

### Step 1: Gather Context

Ask:
- What product or service?
- What data is collected? (personal info, usage data, cookies, location, payment)
- Where are your users? (determines applicable regulations: GDPR, CCPA, etc.)
- Any third-party data sharing? (analytics, advertising, integrations)
- Data storage: where and how long?
- Age restrictions? (COPPA considerations)

### Step 2: Draft the Policy

Apply the **privacy-policy** skill:

Generate sections covering:
- What data is collected and how
- How data is used (purposes)
- Legal basis for processing (GDPR)
- Data sharing and third parties
- Data retention and deletion
- User rights (access, deletion, portability, opt-out)
- Cookie policy
- Security measures
- Children's privacy (if applicable)
- International transfers
- Contact information
- Policy update process

### Step 3: Deliver

```
## Privacy Policy: [Product]

[Full policy text]

### Compliance Checklist
| Regulation | Status | Notes |
|-----------|--------|-------|

### Clauses Requiring Legal Review
| Clause | Why | Priority |
|--------|-----|----------|

### Implementation Checklist
- [ ] Cookie consent banner
- [ ] Data subject request process
- [ ] Data processing records
- [ ] DPA with processors
```

Save as markdown. Offer DOCX export.

## Notes

- This is a template — legal counsel should review before publishing
- GDPR and CCPA have specific requirements that can't be approximated — flag where expert review is essential
- Privacy policies should be in plain language, not legalese
- Update the policy when data practices change, not just annually
