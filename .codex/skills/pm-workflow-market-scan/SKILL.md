---
name: "pm-workflow-market-scan"
description: "Comprehensive macro environment analysis in Codex. Codex wrapper for Claude's /market-scan command."
---

# PM Workflow: Market Scan

This skill is the Codex conversion of Claude's `/market-scan` command from the PM Skills Marketplace.
It preserves the original workflow and underlying PM frameworks, but packages them as a Codex skill instead of a slash command.

## Codex Usage
- Recommended invocation: `$pm-workflow-market-scan <product, market, or industry>`
- Original Claude argument hint: `<product, market, or industry>`
- Source plugin: `pm-product-strategy`
- Original Claude command: `/market-scan`

## Execution Guidance
- Ask only for the minimum missing context needed to continue.
- If the user already provided enough context, skip the interview-style questions and produce the workflow output directly.
- Reuse the imported PM skills referenced below whenever they fit the task.
- Save substantial deliverables as markdown files when helpful.

## Upstream Workflow
## Macro Environment Analysis

Run multiple strategic analysis frameworks to understand your competitive and macro environment. Combines SWOT, PESTLE, Porter's Five Forces, and Ansoff Matrix into a single strategic overview.

## Invocation

```
/market-scan EdTech market for corporate learning
/market-scan [upload a market brief or strategy doc]
/market-scan Our fintech product — preparing for board strategy review
```

## Workflow

### Step 1: Understand the Context

Ask:
- What product, company, or market are you analyzing?
- What's the purpose? (strategic planning, market entry, investor prep, annual review)
- Any specific frameworks you want to focus on? Or run all four?
- What's your current position in this market?

### Step 2: Run the Analysis

Apply four skills in sequence, each building on insights from the previous:

**SWOT Analysis** (apply **swot-analysis** skill):
- Internal: Strengths and Weaknesses
- External: Opportunities and Threats
- Actionable recommendations for each quadrant

**PESTLE Analysis** (apply **pestle-analysis** skill):
- Political, Economic, Social, Technological, Legal, Environmental factors
- Impact assessment and timeline for each factor

**Porter's Five Forces** (apply **porters-five-forces** skill):
- Competitive rivalry, supplier power, buyer power, threat of substitutes, threat of new entrants
- Overall industry attractiveness rating

**Ansoff Matrix** (apply **ansoff-matrix** skill):
- Market penetration, market development, product development, diversification
- Risk-adjusted growth opportunities

### Step 3: Synthesize

Cross-reference findings across frameworks to identify:
- **Converging signals**: What multiple frameworks agree on
- **Strategic imperatives**: Actions that appear critical across analyses
- **Key risks**: Threats and forces to mitigate
- **Growth opportunities**: Where the best risk-adjusted opportunities lie

### Step 4: Generate Report

```
## Strategic Market Scan: [Market/Product]

**Date**: [today]
**Purpose**: [strategic planning / market entry / etc.]

### Executive Summary
[5-7 sentences covering the strategic situation and key recommendations]

### SWOT Analysis
| Strengths | Weaknesses |
|-----------|-----------|
| [internal positives] | [internal negatives] |

| Opportunities | Threats |
|-------------|---------|
| [external positives] | [external negatives] |

**SWOT Actions**: [leverage S+O, mitigate W+T]

### PESTLE Analysis
| Factor | Current State | Impact | Trend | Timeframe |
|--------|-------------|--------|-------|-----------|

### Porter's Five Forces
| Force | Intensity | Key Drivers | Implications |
|-------|----------|------------|-------------|

**Industry Attractiveness**: [High / Medium / Low]

### Ansoff Growth Matrix
| Strategy | Opportunity | Risk Level | Investment | Priority |
|----------|-----------|-----------|-----------|----------|
| Market Penetration | [specifics] | Low | [est.] | [H/M/L] |
| Market Development | [specifics] | Medium | [est.] | [H/M/L] |
| Product Development | [specifics] | Medium | [est.] | [H/M/L] |
| Diversification | [specifics] | High | [est.] | [H/M/L] |

### Cross-Framework Synthesis
**Converging signals**: [what all frameworks agree on]
**Strategic imperatives**: [must-do actions]
**Key risks**: [highest-priority threats]
**Best opportunities**: [risk-adjusted growth plays]

### Strategic Recommendations
1. [Recommendation with supporting evidence from multiple frameworks]
2. ...
3. ...

### Monitoring Plan
| Signal | What to Watch | Source | Check Frequency |
|--------|-------------|--------|----------------|
```

Save as markdown.

### Step 5: Offer Next Steps

- "Want me to **build a product strategy** based on these findings?"
- "Should I **analyze specific competitors** identified in Porter's analysis?"
- "Want me to **design a pricing strategy** for the market penetration opportunity?"

## Notes

- Use web research to ground the analysis in current market data, not just general knowledge
- PESTLE factors should include specific regulations, market data, and trend signals — not generic observations
- Porter's is most useful when you identify the *specific* forces, not just rate them abstractly
- Ansoff should include concrete opportunities, not just generic "enter new markets"
- The synthesis section is the most valuable part — it's where the frameworks talk to each other
