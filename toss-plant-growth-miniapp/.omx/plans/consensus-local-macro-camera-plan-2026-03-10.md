# Consensus Plan — Local-Only Macro-Plant Delight + Camera Capability Track

- **Project:** toss-plant-growth-miniapp
- **Date:** 2026-03-10
- **Mode:** RALPLAN-DR (SHORT)
- **Planning intent:** Improve daily delight/retention now while running a deep technical camera-capability review in parallel.

## Context
Current app already has local-only baseline/daily capture, compare, and timeline loops (`src/pages/index.tsx`, `src/pages/capture.tsx`, `src/pages/compare.tsx`, `src/pages/timeline.tsx`) with local storage (`src/plants/store.ts`).

Camera integration currently uses `openCamera({ base64: true, maxWidth: 720 })` and post-capture detection (`src/detection/*`). Based on current SDK API/types, camera controls are limited to `base64` and `maxWidth`, with no explicit zoom/focus/torch/manual control surface exposed in this app stack.

## Work Objectives
1. Ship **Scope A (UX loop)** improvements that increase repeat daily use and perceived “macro-plant delight” without waiting for camera-stack uncertainty.
2. Run **Scope B (heavy camera capability)** as a deep technical track with explicit options, tradeoffs, and feasibility gate.
3. Preserve hard constraints: **local-only data**, **no SNS/share**, Toss-compatible UX/TDS, and safe submission path.

## Guardrails
### Must Have
- Local-only storage remains authoritative (no backend sync introduced).
- No share/export/SNS pathways in UX or navigation.
- All changed user flows include loading/empty/error states and TDS-compatible components.
- Camera-track decision documented via ADR before heavy implementation.

### Must NOT Have
- No scope coupling that blocks UX iteration on unresolved camera R&D.
- No hidden camera permission behavior changes.
- No ad-flow regressions in capture → compare transitions.

---

## RALPLAN-DR Summary (Consensus Alignment)

### Principles (5)
1. **Retention-first shipping:** deliver daily loop value before deep camera bets finish.
2. **Feasibility before investment:** prove SDK/runtime viability before heavy camera build.
3. **Local-only trust:** keep user data/device boundaries explicit.
4. **Non-blocking tracks:** A and B run in parallel with a hard gate.
5. **Evidence-driven decisions:** options chosen by measured latency, quality, and review risk.

### Decision Drivers (Top 3)
1. **Technical feasibility risk** of advanced camera controls in Apps-in-Toss stack.
2. **Time-to-value for retention UX** (daily return behavior cannot wait).
3. **Submission/review safety** under Toss miniapp constraints.

### Viable Options + Tradeoffs

#### Option 1 — UX-first + current camera API only (no heavy camera build)
- **What:** Keep `openCamera` flow; improve macro guidance/copy/retake logic and post-capture quality prompts.
- **Pros:** Fastest, lowest risk, no new platform uncertainty.
- **Cons:** No true macro camera controls; quality ceiling limited by system camera UI.

#### Option 2 — Hybrid (recommended default path)
- **What:** Ship Option 1 UX improvements + deepen post-capture intelligence (quality scoring, framing confidence, optional on-device model refinement) without replacing camera entry point.
- **Pros:** Retention impact quickly + better perceived “smart camera” quality; still local-only.
- **Cons:** Compute/memory overhead risk; still lacks true live camera controls.

#### Option 3 — Heavy native camera capability track
- **What:** Pursue custom/native-capability approach for zoom/focus/torch/manual control if platform permits.
- **Pros:** Highest potential for true macro capture quality.
- **Cons:** Highest uncertainty (platform support/review risk/maintenance cost), likely longest path.

**Consensus recommendation:** Start with **Option 2** while running feasibility gate for Option 3. If Option 3 fails gate, continue Option 2 roadmap without blocking A.

---

## Task Flow (Split Scope + Non-Blocking Sequence)

- **Parallel start:**
  - **Scope A:** UX loop spec + implementation-ready tasks
  - **Scope B:** camera deep review + technical spikes
- **Gate point:** Feasibility decision after B technical review evidence is gathered.
- **Post-gate:**
  - Gate pass → extend with heavy camera track
  - Gate fail → continue UX + hybrid intelligence track only

---

## Detailed TODOs (3–6 steps) with Acceptance Criteria

### Step 1 — Baseline Audit + Metrics Contract Refresh (A+B)
**Scope:** A + B  
**Actions:**
- Audit current capture/compare/home/timeline flow and detector fallback behavior.
- Expand event spec to include capture quality + retake reasons (still local-only event payloads).
- Record baseline KPIs for loop progression (home→capture→compare→next-day return proxy).

**Acceptance Criteria:**
- Baseline audit doc produced with current-state pain points and file references.
- Updated event spec includes new quality/retake signals and excludes SNS/share semantics.
- KPI baseline table defined for pre/post comparison.

---

### Step 2 — Scope A: UX Loop Improvements (Ship-Ready, Non-Blocking)
**Scope:** A  
**Actions:**
- Define improved “macro delight” UX loop across home/capture/compare/timeline:
  - capture coaching hints (distance/light/stability)
  - post-capture delight messaging tied to streak/report progress
  - clear retake path when quality is weak
- Keep changes within TDS contract and existing route structure.
- Prepare implementation task breakdown and test cases.

**Acceptance Criteria:**
- UX spec covers loading/empty/error states for all changed screens.
- Task list is implementation-ready and mapped to concrete files.
- No dependency on unresolved heavy camera capability decisions.

---

### Step 3 — Scope B: Heavy Camera Capability Technical Deep Review
**Scope:** B  
**Actions:**
- Perform technical review focused on capability surface:
  - SDK/API limits (`openCamera` options, permission behavior)
  - runtime constraints for advanced control aspirations (zoom/focus/torch/live preview)
  - performance envelope for local-only image processing (latency/memory/bundle impact)
- Run 2 spikes:
  1) enhanced post-capture quality pipeline feasibility (within current API)
  2) heavy/native camera capability feasibility (platform + review viability)

**Acceptance Criteria:**
- Camera capability report produced with option-by-option risk and feasibility score.
- Spikes include measurable criteria (capture latency, memory overhead, failure modes).
- Recommendation clearly states what is feasible now vs blocked/uncertain.

---

### Step 4 — Explicit Feasibility Gate + ADR Decision
**Scope:** Gate between A and B  
**Actions:**
- Hold a gate review using Step 3 evidence.
- Decide one path:
  - **B-pass:** proceed to heavy camera implementation track
  - **B-fail:** defer heavy track, continue hybrid/local post-capture path
- Finalize ADR with decision, drivers, alternatives, consequences, and follow-ups.

**Acceptance Criteria:**
- Gate outcome documented as PASS/FAIL with evidence.
- ADR completed and linked from plan artifacts.
- Scope A schedule remains uninterrupted regardless of gate outcome.

---

### Step 5 — Execution Sequencing + Verification Plan
**Scope:** A primary, B conditional  
**Actions:**
- Sequence execution into two release waves:
  - **Wave 1:** Scope A UX loop + instrumentation (always)
  - **Wave 2:** Scope B capability extension (only if gate passes)
- Define verification matrix: functional, retention signal checks, camera quality checks, and Toss submission-readiness checks.
- Include rollback criteria for any camera-related degradation.

**Acceptance Criteria:**
- Two-wave execution schedule published with owners and dependencies.
- Verification checklist includes unit/integration/manual smoke + submission checklist linkage.
- Rollback triggers and rollback owner explicitly identified.

---

## ADR (Decision Record — Ready for Architect/Critic Review)

- **Decision (proposed):** Adopt Option 2 (UX-first + hybrid intelligence) immediately; pursue Option 3 only if feasibility gate passes.
- **Drivers:** feasibility risk, time-to-retention value, submission safety.
- **Alternatives considered:**
  - Option 1 (UX-only)
  - Option 3 (heavy native capability)
- **Why chosen:** balances immediate product value with technical due diligence and avoids schedule lock.
- **Consequences:**
  - Near-term delight gains can ship now.
  - Heavy camera effort is evidence-gated, reducing sunk cost risk.
- **Follow-ups:**
  - complete Step 3 report,
  - run Step 4 gate,
  - finalize Wave 2 scope only on pass.

## Success Criteria
- Scope A ships independently and improves loop quality without violating local-only/no-share constraints.
- Scope B has a documented technical verdict with explicit go/no-go rationale.
- One ADR-backed path is selected and execution-ready.
- No unresolved blocker prevents Wave 1 execution.

## Suggested Plan Artifacts
- `docs/plans/macro-delight-ux-spec.md`
- `docs/plans/camera-capability-feasibility.md`
- `docs/plans/camera-track-adr.md`
- `docs/plans/verification-matrix-macro-camera.md`

