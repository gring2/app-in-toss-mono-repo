---
name: "pm-workflow-battlecard"
description: "Create a sales-ready competitive battlecard in Codex. Codex wrapper for Claude's /battlecard command."
---

# PM Workflow: Battlecard

This skill is the Codex conversion of Claude's `/battlecard` command from the PM Skills Marketplace.
It preserves the original workflow and underlying PM frameworks, but packages them as a Codex skill instead of a slash command.

## Codex Usage
- Recommended invocation: `$pm-workflow-battlecard <your product> vs <competitor>`
- Original Claude argument hint: `<your product> vs <competitor>`
- Source plugin: `pm-go-to-market`
- Original Claude command: `/battlecard`

## Execution Guidance
- Ask only for the minimum missing context needed to continue.
- If the user already provided enough context, skip the interview-style questions and produce the workflow output directly.
- Reuse the imported PM skills referenced below whenever they fit the task.
- Save substantial deliverables as markdown files when helpful.

## Upstream Workflow
## Competitive Battlecard

Create a concise, sales-ready battlecard that helps your team win deals against a specific competitor. Includes positioning, feature comparison, objection handling, and conversation strategies.

## Invocation

```
/battlecard Our CRM vs Salesforce
/battlecard ProjectFlow vs Monday.com for mid-market teams
/battlecard [upload competitor materials or win/loss data]
```

## Workflow

### Step 1: Identify the Matchup

Ask:
- Your product and the specific competitor
- Who is the typical buyer choosing between you?
- Do you have win/loss data or sales feedback?
- What deal stage does this typically come up? (early evaluation, final decision, displacement)

### Step 2: Research the Competitor

Apply the **competitive-battlecard** skill with web research:

- Current product capabilities and recent launches
- Pricing model and published pricing
- Target market and positioning
- Known weaknesses (from reviews, forums, customer feedback)
- Recent company news (funding, leadership, strategy shifts)

### Step 3: Generate Battlecard

```
## Competitive Battlecard: [Your Product] vs [Competitor]

**Last updated**: [today]
**Use when**: [situation where this competitor comes up]

### Quick Summary
**We win when**: [buyer profile and situation where you have advantage]
**We lose when**: [buyer profile and situation where competitor has advantage]
**Key differentiator**: [one sentence]

### Positioning
**How they position**: [their messaging]
**How we position against them**: [our counter-positioning]

### Feature Comparison
| Capability | Us | Them | Verdict |
|-----------|-----|------|---------|
| [capability] | [status] | [status] | [advantage] |

### Pricing Comparison
| Dimension | Us | Them | Notes |
|----------|-----|------|-------|

### Objection Handling
| Objection | Response | Proof Point |
|----------|---------|------------|
| "They have [feature]" | [response] | [evidence] |
| "They're cheaper" | [response] | [TCO analysis] |
| "They're more established" | [response] | [counter] |

### Landmines to Plant
[Questions to ask the prospect that expose competitor weaknesses]
1. "Ask them about [topic] — their answer will reveal [weakness]"

### Trap Questions to Expect
[Questions the competitor will encourage the prospect to ask you]
1. "[Question]" — How to respond: [response]

### Win/Loss Patterns
**We typically win because**: [top 3 reasons]
**We typically lose because**: [top 3 reasons]

### Conversation Starters
**If they're already using [Competitor]**:
- [approach for displacement deals]

**If they're evaluating both**:
- [approach for competitive evaluations]

### Resources
- [Customer story / case study that counters this competitor]
- [Third-party comparison or review]
- [Demo script optimized for this competitive situation]
```

Save as markdown.

### Step 4: Offer Next Steps

- "Want me to **create battlecards for other competitors**?"
- "Should I **run a full competitive analysis** of the market?"
- "Want me to **draft customer-facing comparison content** based on this?"
- "Should I **update the positioning** based on competitive insights?"

## Notes

- Battlecards should be updated quarterly — competitors change fast
- "Landmines" are the most valuable section for sales — teach reps what questions to ask
- Never trash the competitor in front of the prospect — position on your strengths, not their weaknesses
- Win/loss data from real deals is worth 10x any analysis — encourage the user to add it
- Keep it to one page equivalent — sales reps won't read a 10-page document during a call
