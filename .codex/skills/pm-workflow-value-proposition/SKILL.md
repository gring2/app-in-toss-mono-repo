---
name: "pm-workflow-value-proposition"
description: "Design a value proposition using the 6-part JTBD template in Codex. Codex wrapper for Claude's /value-proposition command."
---

# PM Workflow: Value Proposition

This skill is the Codex conversion of Claude's `/value-proposition` command from the PM Skills Marketplace.
It preserves the original workflow and underlying PM frameworks, but packages them as a Codex skill instead of a slash command.

## Codex Usage
- Recommended invocation: `$pm-workflow-value-proposition <product or feature>`
- Original Claude argument hint: `<product or feature>`
- Source plugin: `pm-product-strategy`
- Original Claude command: `/value-proposition`

## Execution Guidance
- Ask only for the minimum missing context needed to continue.
- If the user already provided enough context, skip the interview-style questions and produce the workflow output directly.
- Reuse the imported PM skills referenced below whenever they fit the task.
- Save substantial deliverables as markdown files when helpful.

## Upstream Workflow
## Value Proposition Design

Design a clear, compelling value proposition for a product or feature using the 6-part JTBD template. An alternative to Strategyzer's Value Proposition Canvas that starts with the customer and focuses on practical outcomes.

## Invocation

```
/value-proposition AI writing tool for non-native English speakers
/value-proposition [upload pitch deck, PRD, or competitive analysis]
/value-proposition                    # asks about your product
```

## Workflow

### Step 1: Understand the Product and Market

Accept context from:
- Product description (verbal or written)
- Uploaded documents (pitch decks, PRDs, competitive analyses)
- Existing value propositions to refine

Ask key questions:
- What does the product do? Who is it for?
- What alternatives or workarounds exist today?
- What customer insights or research do you have?

### Step 2: Build the Value Proposition

Apply the **value-proposition** skill to produce the 6-part template:

```
## Value Proposition: [Product]

### For [Segment]:

1. **Who**: [target user profile and characteristics]
2. **Why**: [the job they're trying to do, desired outcomes]
3. **What Before**: [their current painful reality — existing tools, friction, workarounds]
4. **How**: [your solution — specific features and capabilities that deliver value]
5. **What After**: [the improved outcome — what becomes possible]
6. **Alternatives**: [what they'd use without you, and why you're better]

### Value Proposition Statement
[One sentence: For [who] who [need], [product] is a [category] that [benefit]. Unlike [alternative], we [differentiator].]

### Value Proposition Statements (Reusable)
- Marketing: [...]
- Sales: [...]
- Onboarding: [...]
```

If the user has multiple segments, create a separate value proposition for each.

### Step 3: Save and Offer Next Steps

Save as markdown. Offer:
- "Want me to **compare this against competitors** with a Value Curve?"
- "Should I **build a full strategy** around this value proposition?"
- "Want me to **create a Lean Canvas** or **Startup Canvas** using this?"
- "Should I **generate marketing messaging** from these value prop statements?"

## Notes

- This template starts with the customer (Who/Why) and works toward the solution — unlike Strategyzer's canvas which places the product on the left
- Each value proposition is segment-specific — different segments get different value props
- Use a Value Curve (Blue Ocean Strategy) to visually compare your offering against competitors across key factors
- Value Proposition is one element of product strategy — use `/strategy` for the full picture
