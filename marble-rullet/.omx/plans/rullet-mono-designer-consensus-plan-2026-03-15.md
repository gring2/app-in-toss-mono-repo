# The Rullet Mono Mobile Redesign — Consensus Plan

## Plan Summary
- Scope: reposition and redesign The Rullet so it is less clone-like, more smartphone-friendly, and visually mono before any implementation.
- Evidence base:
  - `source/index.html` and `source/src/app.ts` already structure the app as `Setup -> Draw -> Result`.
  - `source/assets/style.scss` still uses bright blue cards/CTA styling and wide card spacing that reads closer to a general web app than a tightly tuned mono miniapp.
  - `source/src/data/constants.ts` still uses dark/cyan/yellow game-theme rendering, which keeps arcade/game energy close to the original Marble Roulette feel.
  - Original external reference is still explicitly titled `Marble Roulette`; user wants The Rullet to feel less like that source.

## RALPLAN-DR

### Principles
1. **Utility over spectacle** — frame the product as a trusted draw helper, not a gambling toy.
2. **Phone-first control density** — one-thumb setup, short vertical flows, readable on small screens first.
3. **Mono by default, motion as accent** — black/white/gray system with animation reserved for the marble moment.
4. **Differentiate through interaction model** — do not merely recolor the original; change hierarchy and information flow.
5. **Spec before build** — retention, monetization guardrails, and design states must be approved before coding.

### Decision Drivers
1. **Differentiation**: user explicitly says current app feels too close to lazygyu Marble Roulette.
2. **Miniapp trust/mobile fit**: Toss-style miniapps should feel simple, fast, and safe on phones.
3. **Preserve core magic**: marble physics should remain the product signature, but not dominate every screen.

### Viable Options

#### Option A — Mono Control-First Utility Shell **(Recommended)**
- Description: setup screen becomes the hero; marble field is secondary until the draw starts; result screen emphasizes winner clarity and rerun speed.
- Pros:
  - Strongest differentiation from the original.
  - Best smartphone ergonomics and one-hand usability.
  - Easiest path to mono identity and Toss-trust framing.
- Cons:
  - Risks reducing some of the current “wow” factor if the draw screen becomes too restrained.
  - Requires deliberate motion/art direction so the draw still feels special.

#### Option B — Mono Cabinet / Full-Stage Experience
- Description: keep the marble stage as the dominant full-screen surface, but recolor it to black/white and simplify controls.
- Pros:
  - Preserves spectacle with minimal conceptual change.
  - Lower design migration cost.
- Cons:
  - Too likely to still read as “the original but monochrome.”
  - Harder to make truly phone-first because the stage keeps winning the layout.

#### Option C — List-First Minimal Picker with Tiny Simulation
- Description: prioritize form/result cards, reduce simulation to a small preview or post-submit reveal.
- Pros:
  - Simplest UI and fastest setup.
  - Very strong utility framing.
- Cons:
  - Over-corrects and weakens the product’s unique marble identity.
  - Risk of becoming a generic name picker.

### Alternative invalidation
- **Reject Option B** as primary direction because it solves color similarity more than structural similarity.
- **Reject Option C** as primary direction because it throws away too much of the marble differentiator.
- **Choose Option A** because it changes both hierarchy and brand feel while keeping the physics payoff.

## Recommended Plan

### Phase 1 — Spec Gate: align product intent before visuals
**Owners**: Retention UX Specialist + Apps-in-Toss Monetization Specialist  
**Goal**: define what “simpler and smarter on phone” means in user and business terms.

**Outputs**
- Retention hypothesis for faster repeat use (ex: saved groups + faster rerun loop).
- KPI targets/guardrails for repeat use, setup completion, rerun rate, and draw completion.
- Monetization guardrail doc explicitly stating either “no ads in redesign scope” or safe future constraints.
- Edge-case handling for empty names, too many names, long names, duplicate names, and draw interruption.

**Acceptance criteria**
- A written journey exists for Setup, Draw, Result, Empty, Error, and Recover states.
- KPI/guardrail section defines success and regression thresholds.
- Monetization output does not introduce trust-breaking placements.

### Phase 2 — Design Gate: mono mobile system and screen spec
**Owner**: Toss Miniapp UI Designer  
**Goal**: convert Option A into Toss-compatible screen specs.

**Outputs**
- 3-screen spec set: `Compose`, `Draw`, `Result`.
- Mono design tokens: background, text, stroke, disabled, emphasis, motion rules.
- Component mapping for miniapp-safe surfaces (top area, list, chips, inputs, CTA, result cards, toast, bottom action area).
- Loading/empty/error states for every screen.
- Handoff notes that explicitly call out what must change in `source/index.html`, `source/assets/style.scss`, `source/src/app.ts`, and render theme constants.

**Acceptance criteria**
- Each screen fits a phone-first vertical layout without relying on large desktop spacing.
- Visual hierarchy is black/white/gray first, with at most one restrained accent reserved for CTA or active state.
- The draw screen uses motion to create excitement without restoring clone-like “full-stage first” dominance.

### Phase 3 — Differentiate the interaction model
**Owners**: Retention UX Specialist + Toss Miniapp UI Designer  
**Goal**: make the product feel distinct beyond palette changes.

**Required interaction decisions**
- Rename Setup to **Compose** or **Prepare** and avoid roulette/gambling language.
- Make saved groups, recent groups, and rerun the primary repeat-use loop.
- Demote “advanced options” unless they are frequently needed; default path should be one-textarea + one CTA.
- Turn draw mode into a focused “one moment” state: compact top info, stage centered, auto-advance to result.
- Make result state actionable: rerun same group, edit group, copy/share result.

**Acceptance criteria**
- At least 3 interaction differences from the original are explicitly documented.
- Repeat-use loop can be completed in fewer taps than the current setup flow.
- Product naming/copy avoids over-gamified language.

### Phase 4 — Execution handoff package
**Owners**: Planner handoff to team/ralph follow-up  
**Goal**: hand execution a buildable spec package, not ideas.

**Outputs**
- Approved UX spec
- Approved design spec
- Monetization guardrail note
- File-level implementation map
- Verification checklist for later build/review

**Acceptance criteria**
- Developer can start without reopening scope discovery.
- Reviewer can evaluate future implementation against explicit states and guardrails.
- Ralph/team handoff path is documented.

## Verification Steps for this planning phase
1. Confirm design direction names and screen hierarchy are distinct from the original title/framing.
2. Check the spec package covers Setup/Draw/Result plus loading/empty/error states.
3. Check follow-up staffing matches AGENTS.md pipeline: Spec Gate before Design Gate before Build Gate.
4. Confirm recommended team launch is designer-first and not direct coding.

## Risks
- **Mono becomes dull**: mitigate by using motion, depth, and typography contrast instead of color noise.
- **Too much simplification removes delight**: preserve the draw as the only high-motion moment.
- **Clone risk remains**: explicitly change screen names, layout hierarchy, and repeat-use mechanics, not just theme values.
- **Spec drift into implementation**: block coding until the specialist outputs exist.

## ADR
- **Decision**: adopt a mono, control-first, phone-first redesign direction for The Rullet, with the marble simulation demoted to a focused draw moment instead of the primary identity surface.
- **Drivers**: differentiation from original, better Toss miniapp trust/mobile fit, retention-safe repeat use.
- **Alternatives considered**:
  1. Mono full-stage cabinet approach
  2. Ultra-minimal picker with tiny simulation
- **Why chosen**: it preserves the marble signature while making the product feel structurally new and easier to use on phones.
- **Consequences**:
  - More design/spec work up front.
  - Some existing visual spectacle must be intentionally re-authored, not merely recolored.
  - Future implementation will touch structure, styling, and renderer theme behavior.
- **Follow-ups**:
  - Produce specialist specs.
  - Run designer-heavy team consultation.
  - Only then hand to implementation/review.

## Available-agent-types roster for follow-up
- `worker` (used for Retention UX Specialist, Toss Miniapp UI Designer, Apps-in-Toss Monetization Specialist, Toss Submission Readiness Specialist)
- `toss_miniapp_developer`
- `toss_miniapp_reviewer`
- `awaiter`
- `ralph` (execution/verification mode after planning approval)
- `team` (parallel orchestration mode after planning approval)

## Follow-up staffing guidance

### Recommended immediate next step: designer-heavy team consult
Note: the roster-safe worker type here is `worker` rather than `designer`, because AGENTS.md defines these specialists under the worker lane.
**Best roster-safe launch**
```bash
$team 3:worker "Spec/design consult for The Rullet mono mobile redesign. worker-2 acts as Retention UX Specialist and defines repeat-use journey, KPI guardrails, and edge states first. worker-3 acts as Apps-in-Toss Monetization Specialist and documents no-ad or retention-safe monetization guardrails first. worker-1 then acts as Toss Miniapp UI Designer and converts those approved guardrails into Compose/Draw/Result screen specs + mono component mapping. Output one aligned spec package only; no implementation."
```

**Suggested lane reasoning levels**
- worker-1 / UI Designer: **high** — core lane, owns differentiation and phone-first layout.
- worker-2 / Retention UX: **medium** — validates repeat-use loop and churn guardrails.
- worker-3 / Monetization: **low-medium** — mainly guardrail/spec completeness unless monetization scope expands.

**Why these lanes exist**
- UI Designer: converts user preference into concrete screen/system spec.
- Retention UX: ensures simplification does not reduce repeat utility.
- Monetization: closes AGENTS.md Spec Gate even if the output is “no monetization changes now.”

### Suggested ralph follow-up after the team consult
Use Ralph only after the specialist outputs are approved and translated into an implementation brief.

```bash
$ralph "Implement the approved The Rullet mono mobile redesign spec in ./source, preserving marble physics while updating structure, mono theme tokens, screen copy, edge states, and Toss miniapp branding; verify with build, tests, and reviewer-ready evidence."
```

**Ralph lane expectations**
- implementation lane: `toss_miniapp_developer` equivalent, **medium-high**
- evidence/regression lane: `awaiter`, **medium**
- final sign-off lane: `toss_miniapp_reviewer`, **high**

## Team -> Ralph verification path
1. **Team consult completes** with aligned outputs from UI Designer, Retention UX, and Monetization Specialist.
2. **Leader condenses outputs** into one approved implementation brief + file touchpoint map.
3. **Ralph executes implementation** against that brief only.
4. **Awaiter runs build/test smoke checks**.
5. **toss_miniapp_reviewer reviews** for regressions, policy, and state coverage.
6. **Submission readiness** happens only after implementation is stable.

## Handoff Contract
- **Context**: The current app already has a useful 3-step shell but still reads too close to the original due to title/framing, stage-first energy, and colorful game-like theming.
- **Decision**: pursue Option A, a mono control-first utility shell with a focused draw moment.
- **Output**: designer-heavy specialist consult package before any coding.
- **Risks**: under-designed mono theme, clone drift, loss of delight if motion is over-cut.
- **Next owner**: `$team` with 3 `worker` lanes as specified above.
