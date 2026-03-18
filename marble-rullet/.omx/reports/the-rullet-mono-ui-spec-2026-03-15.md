# The Rullet mono mobile redesign — aligned UI spec package (provisional)

## Context
- Owner: worker-1 (`Toss Miniapp UI Designer` role for task 1)
- Reviewed source of truth:
  - `source/index.html`
  - `source/src/app.ts`
  - `source/granite.config.ts`
- Current live information architecture is a 3-step mobile flow: `Setup -> Draw -> Result`.
- Upstream retention and monetization guardrails referenced in task 1 were **not present in team state** when this spec was drafted on 2026-03-15, so this package uses **provisional Toss-safe guardrails** derived from the current product and AGENTS.md.

## Decision summary

| Decision | Why | Metric impact expectation |
|---|---|---|
| Rename `Setup` to `Compose` and keep composition on one screen | Reduces cognitive load and matches the actual user job: prepare one fair draw fast | Start-draw conversion +5 to +10%; median time-to-first-draw -20% |
| Keep `Draw` visually minimal with only status + explicit exit | Prevents accidental interruption and keeps trust in the fairness animation | Mid-draw abandonment -10%; draw completion rate +3 to +5% |
| Make `Rerun draw` the primary result CTA, `Edit names` secondary, `Copy result` tertiary | Repeat-use is the highest-value retention behavior after one successful draw | Same-session repeat draw rate +8 to +15% |
| Keep map/layout as advanced, not primary | The core job is “pick a winner”, not “customize the arena” | Start friction -5%; option misuse -20% |
| Allow deeplink entry only to `Compose`; treat `Draw` and `Result` as internal routes | Avoids broken resume states and prevents invalid result deep links | Invalid-entry error rate near 0; support burden reduced |
| Keep the Toss navigation chrome monochrome and restrained | Aligns with Toss navigation guidance and avoids gaming-style visual distrust | Perceived trust / clarity improvement; review risk reduced |
| No ad or monetization surface inside Compose/Draw/Result core path in this package | Monetization guardrails were not delivered; safest aligned choice is non-blocking/no-ad core flow | Retention risk minimized; monetization intentionally deferred |

## Provisional guardrails used for this spec
1. Open-to-draw path should stay within **3 primary interactions** for returning users with presets.
2. No forced permission request before user intent. Clipboard write remains **result-action only**.
3. No blocking ads, rewarded gates, or interstitials in the core flow.
4. Every user-facing screen must define **loading / empty / error** behavior.
5. User input is never discarded silently.
6. Draw fairness UI must not be obscured by heavy overlays or modal promotions.
7. External deeplink entry must resolve to `Compose` with validated params only.

## Output

### 1) Information architecture and routing

#### Route model
- `compose` — launch/default entry; supports validated incoming params.
- `draw` — internal-only route reached after successful validation.
- `result` — internal-only route reached after a completed draw.

#### Deeplink behavior
- Supported external entry: `compose`
- Optional query params on `compose`:
  - `names`
  - `mode` (`first | last | custom`)
  - `rank`
  - `map`
- Invalid params fall back to defaults instead of throwing.
- `draw` and `result` should not be externally addressable without valid in-memory state.

### 2) Screen specs

---

## Screen A — Compose

### Goal
Let users assemble a draw fast, understand the winner rule, and start with confidence.

### Layout
1. **Navbar**
   - Title: `마블 추첨`
   - Left: none on root entry
   - Right: optional text action later (`도움말`) only if product adds support/help
2. **Header summary block**
   - Title: `마블 추첨`
   - Body copy: one short line on fairness + speed
3. **Participants section**
   - Primary multiline input for participant names
   - Helper copy shows current count and selected winner target
   - Count badge on the section header
4. **Winner mode section**
   - Segmented control: `First`, `Last`, `Custom rank`
   - If `Custom rank`, show inline numeric spinner below the segmented control
5. **Advanced options section**
   - Collapsed by default
   - Contains `Map layout` selector only
6. **Recent presets section**
   - Horizontal quick-apply surface for last-used name groups
   - Destructive clear action secondary and low emphasis
7. **Sticky bottom CTA**
   - Summary text: ready state + current mode
   - Primary button: `Start draw`

### Key interaction rules
- User can paste newline- or comma-separated names.
- On blur, names normalize/dedupe using the app’s current parsing logic.
- `Start draw` stays disabled until at least 1 valid participant exists.
- Custom rank auto-clamps to `1..participantCount`.
- Map selection never blocks start.

### States
- **Loading**
  - Only needed if preset storage or map list is not ready yet.
  - CTA disabled; show skeleton rows for presets and muted helper text.
- **Empty**
  - Default input empty state
  - Recent presets empty message: `최근에 사용한 참여자 그룹이 여기에 표시돼요.`
- **Error**
  - Invalid custom rank -> inline helper/error under rank control
  - Parsing failure / zero valid names -> helper error + CTA disabled
  - Storage read failure -> non-blocking toast + continue without presets

### Copy direction
- Replace “Setup” framing with “Compose” framing.
- Emphasize fairness and quick repeat play over configuration.

---

## Screen B — Draw

### Goal
Show the draw in progress with high trust and low interruption.

### Layout
1. **Minimal top bar**
   - Left/center: compact status pill (`participant count · mode`)
   - Right: low-emphasis exit action `편집`
2. **Full-bleed draw canvas**
   - Marble animation remains the hero asset
3. **Bottom/center copy block**
   - Headline: `추첨 중이에요`
   - Subcopy: `결과는 자동으로 열려요.`

### Key interaction rules
- No other controls appear while the draw is active.
- Exit requires confirm dialog if animation is already running.
- Result route auto-opens after draw completion.
- No monetization surfaces, banners, or interruptive notices on this screen.

### States
- **Loading**
  - Engine/bootstrap phase after tapping start and before marbles visibly run
  - Show same draw screen, but with disabled exit and copy `추첨 준비 중이에요`
- **Empty**
  - Not user-reachable; invalid state should redirect to Compose
- **Error**
  - Physics/render initialization failure -> full-screen error treatment with `다시 시도` and `참여자 편집`
  - Exit tap while running -> confirm dialog, not immediate reset

### Trust guardrail
- Keep overlays translucent and sparse so the fairness mechanic remains visible.
- Avoid color-heavy UI or celebratory clutter before the result is known.

---

## Screen C — Result

### Goal
Make the selected winner instantly legible, preserve trust with full ranking visibility, and maximize rerun behavior.

### Layout
1. **Result hero**
   - Title is the winning name
   - Supporting line: selected rank and participant count
   - Count badge stays visible
2. **Ranking list**
   - Ordered list of all entries
   - Winner row visually distinct but not gaudy
3. **Action stack**
   - Primary: `Rerun draw`
   - Secondary: `Edit names`
   - Tertiary: `Copy result`
4. **Reserved optional area**
   - Keep below ranking/actions and unused for v1 spec package
   - If future monetization is approved, it must live here only and remain dismissible/non-blocking

### Key interaction rules
- `Rerun draw` reuses the last successful participant set and current winner mode.
- `Edit names` returns to Compose with state preserved.
- `Copy result` produces the current shareable plain-text output.

### States
- **Loading**
  - Short handoff state between draw complete event and result render
  - Keep draw screen visible until snapshot is ready
- **Empty**
  - If ranking snapshot is missing, show empty ranking row with clear fallback copy
- **Error**
  - Copy failure -> bottom toast
  - Missing active names for rerun -> toast + no route change

### Retention focus
- Primary CTA is not “done”; it is “do it again”.
- Result should feel conclusive but frictionless to repeat.

### 3) Mono/TDS component mapping

> Note: current codebase is a **WebView app** (`@apps-in-toss/web-framework`), but this mapping targets the requested Toss miniapp design surface using **Granite-style navigation + `@toss/tds-react-native` components** for future migration/design handoff. Where no exact TDS RN component was surfaced in the retrieved docs, the closest approved pattern is named explicitly.

| Product element | Recommended TDS RN / Granite mapping | Notes |
|---|---|---|
| Top navigation | `Navbar` | Root Compose screen can use title-only; internal screens use `BackButton`/`CloseButton` as needed |
| Section count pill | `Badge` (`weak` for informational counts) | Use for `N entries`, selected mode hints |
| Participants multiline entry | `TextField` (`variant="big"`) **if multiline is implementation-confirmed**; otherwise a native multiline input styled to match TDS field tokens | Retrieved docs did not surface a dedicated `TextArea` component |
| Winner mode switcher | `SegmentedControl` | Maps directly to `first / last / custom` |
| Custom rank control | `NumericSpinner` | Better than freeform numeric input for clamp-safe rank editing |
| Map selector | `TextField.Button` or `Dropdown` | Keep inside advanced section only |
| Preset quick apply | Horizontal `Carousel` of weak `Button`s or tappable cards | No dedicated chip component surfaced in retrieved docs |
| Preset clear action | `TextButton` or weak `Button` | Secondary/destructive placement only |
| Sticky primary CTA | `Button` (`type="primary"`, `size="big"`, `display="full"`) | Disabled until validation passes |
| Result ranking list | `List` + `ListRow` | Winner row may use badge/right text, but keep ordered rank legible |
| Exit confirmation | `ConfirmDialog` | Required once draw is in progress |
| Copy/clear/success feedback | `Toast` | Bottom placement preferred |
| Screen-level failure | `ErrorPage` | Use for engine/bootstrap failure or unrecoverable route state |

### 4) Screen-to-component handoff

#### Compose handoff
- `Navbar`
- Header block using standard typography stack
- Participant field using `TextField`-style shell
- `Badge` for participant count
- `SegmentedControl`
- Conditional `NumericSpinner`
- Optional advanced selector via `Dropdown` or `TextField.Button`
- Presets via `Carousel` + weak `Button`
- Sticky `Button`
- `Toast` for preset clear/storage errors

#### Draw handoff
- `Navbar` or custom minimal top bar aligned with Toss navigation spacing
- Non-TDS canvas region remains product-specific
- `ConfirmDialog` on exit
- `ErrorPage` fallback on engine failure

#### Result handoff
- Header/hero with standard typography
- `Badge`
- `List` + `ListRow`
- Primary/secondary/tertiary buttons
- `Toast` for copy success/failure

### 5) Motion and behavior notes
- Preserve the current physics canvas as the emotional centerpiece.
- Keep Compose and Result transitions under 200ms; Draw -> Result can use the existing short delayed reveal.
- Respect reduced-motion preference for nonessential effects.
- Do not add celebratory confetti or reward bursts; they lower trust in a fairness tool.

### 6) Event instrumentation spec (minimal UI layer)
- `compose_viewed`
  - params: `has_saved_names`, `preset_count`
- `preset_applied`
  - params: `preset_size`
- `winner_mode_changed`
  - params: `mode`
- `custom_rank_changed`
  - params: `rank`, `participant_count`
- `map_changed`
  - params: `map_id`
- `draw_started`
  - params: `participant_count`, `mode`, `rank`, `map_id`, `used_preset`
- `draw_exit_confirmed`
  - params: `elapsed_ms`
- `draw_completed`
  - params: `participant_count`, `mode`, `rank`, `duration_ms`
- `result_rerun_tapped`
  - params: `participant_count`, `mode`
- `result_edit_tapped`
  - params: `participant_count`
- `result_copy_tapped`
  - params: `success`
- `ui_error_shown`
  - params: `screen`, `error_type`

### 7) Handoff notes for implementation owner
1. Keep route ownership simple: `compose` is the only external entry.
2. Preserve current parsing behavior (`comma`, `newline`, `/weight`, `*count`) because it is already valuable power-user functionality.
3. Treat multiline participant entry as a **design blocker to verify early** in TDS RN because retrieved docs did not expose a dedicated textarea primitive.
4. If implementation remains WebView instead of Granite/RN, adapt this spec to the closest TDS web/mobile primitives while preserving the same information architecture and state model.
5. Do not add monetization surfaces without a follow-up approved spec.

## Risks
- Upstream Retention UX / Monetization outputs referenced in task text were unavailable, so KPI guardrails here are provisional.
- Current app runtime is WebView, while requested mapping targets Granite/TDS RN; implementation needs a runtime decision before coding.
- Multiline participant input may require a custom wrapper if TDS RN `TextField` does not support the needed behavior.

## Next owner
- `toss_miniapp_developer` after leader approval of this spec package and runtime choice (stay WebView vs migrate to Granite/RN).

## Source links used
- Current app structure: local files listed in Context
- Granite / routing docs:
  - https://developers-apps-in-toss.toss.im/bedrock/reference/framework/코어/Bedrock.md
  - https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면
  - https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.md
- TDS RN docs:
  - https://tossmini-docs.toss.im/tds-react-native/components/navbar/
  - https://tossmini-docs.toss.im/tds-react-native/components/button/
  - https://tossmini-docs.toss.im/tds-react-native/components/text-field/
  - https://tossmini-docs.toss.im/tds-react-native/components/segmented-control/
  - https://tossmini-docs.toss.im/tds-react-native/components/numeric-spinner/
  - https://tossmini-docs.toss.im/tds-react-native/components/dropdown/
  - https://tossmini-docs.toss.im/tds-react-native/components/carousel/
  - https://tossmini-docs.toss.im/tds-react-native/components/badge/
  - https://tossmini-docs.toss.im/tds-react-native/components/list/
  - https://tossmini-docs.toss.im/tds-react-native/components/list-row/
  - https://tossmini-docs.toss.im/tds-react-native/components/dialog/
  - https://tossmini-docs.toss.im/tds-react-native/components/toast/
  - https://tossmini-docs.toss.im/tds-react-native/components/error-page/
