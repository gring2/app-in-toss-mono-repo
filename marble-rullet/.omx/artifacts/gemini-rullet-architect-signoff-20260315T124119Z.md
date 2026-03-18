# Original user task
Implement The Rullet in ./source using the approved 2026-03-15 implementation brief and supporting handoff docs, preserving marble physics and shipping a restrained Toss-adjacent Compose -> Draw -> Result WebView experience with explicit verification and architect sign-off.

# Final prompt sent to Gemini CLI
You are acting as the architect sign-off reviewer for The Rullet implementation.

Review goal:
Decide whether this implementation is GO or NO-GO against these approved requirements:
- Preserve marble physics and fairness feel.
- Keep the current WebView/Parcel runtime unless blocked.
- Ship the information architecture Compose -> Draw -> Result.
- Make the UX feel restrained, trustworthy, mono-first, utility-led, smartphone-friendly, and clearly less like the original Marble Roulette.
- Include loading / empty / error states for user-facing flows.
- Keep monetization out of the v1 core flow.
- Keep Draw focused/full-screen, but do not let Compose or Result be dominated by the canvas.
- Prefer Toss-adjacent mood over game/casino energy.

Implementation files changed:
- source/index.html
- source/assets/style.scss
- source/src/app.ts
- source/src/data/constants.ts
- source/src/marble.ts
- source/src/roulette.ts
- source/src/rouletteRenderer.ts
- source/src/types/ColorTheme.ts

Verification already completed locally:
- ./node_modules/.bin/tsc --noEmit: PASS
- npm run lint: PASS
- npm run build: PASS
- diagnostics clean on app.ts, roulette.ts, rouletteRenderer.ts, marble.ts, data/constants.ts
- known explicit gap: no npm test script exists in this project

Return exactly these sections:
1. Verdict: GO or NO-GO
2. Blockers
3. Residual risks
4. Architect sign-off note

Implementation diff follows.
diff --git a/assets/style.scss b/assets/style.scss
index bf13ef0..48b0731 100644
--- a/assets/style.scss
+++ b/assets/style.scss
@@ -1,572 +1,602 @@
 :root {
-  --copyright-color: white;
-}
-
-:root.light {
-  --copyright-color: black;
+  color-scheme: light;
+  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
+  --app-bg: #f2f4f6;
+  --panel: rgba(255, 255, 255, 0.94);
+  --panel-strong: rgba(17, 19, 24, 0.72);
+  --panel-border: rgba(15, 23, 42, 0.08);
+  --panel-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
+  --text: #191f28;
+  --muted: #6b7684;
+  --muted-strong: #4e5968;
+  --line: rgba(15, 23, 42, 0.12);
+  --line-strong: rgba(15, 23, 42, 0.2);
+  --accent: #3182f6;
+  --accent-soft: rgba(49, 130, 246, 0.12);
+  --danger: #d64545;
+  --dark-surface: rgba(10, 12, 16, 0.78);
+  --dark-line: rgba(255, 255, 255, 0.16);
+  --dark-text: #f8fafc;
 }
 
 * {
   box-sizing: border-box;
 }
 
+html,
+body {
+  width: 100%;
+  min-height: 100%;
+  margin: 0;
+  background: var(--app-bg);
+  color: var(--text);
+}
+
+body {
+  position: relative;
+}
+
+body.mode-draw {
+  background: #05070a;
+}
+
 canvas {
   position: fixed;
   inset: 0;
   width: 100%;
   height: 100%;
+  z-index: 1;
+  opacity: 0;
+  pointer-events: none;
   touch-action: none;
   -webkit-touch-callout: none;
   -webkit-user-select: none;
   user-select: none;
+  transition: opacity 220ms ease, filter 220ms ease;
 }
 
-div.copyright {
-  position: fixed;
-  bottom: 0;
-  left: 50%;
-  transform: translateX(-50%);
-  color: var(--copyright-color);
-  font-size: 12px;
-  z-index: 999;
-  width: 90%;
-  text-align: center;
+body.mode-draw canvas {
+  opacity: 1;
+  filter: saturate(0.72) contrast(1.04);
 }
 
-div.copyright a {
-  color: var(--copyright-color);
+body.mode-result canvas {
+  opacity: 0.18;
+  filter: grayscale(0.4) saturate(0.28) contrast(1.02);
 }
 
-.icon {
-  background: currentColor;
-  mask-repeat: no-repeat;
-  mask-position: center center;
-  mask-size: contain;
-  display: inline-block;
-  width: 25px;
-  height: 25px;
-  vertical-align: middle;
+.app-shell {
+  position: relative;
+  z-index: 2;
+  min-height: 100svh;
+  padding: max(20px, env(safe-area-inset-top)) 16px calc(112px + env(safe-area-inset-bottom));
+}
 
-  &.play {
-    mask-image: url('images/play.svg');
-  }
+.screen {
+  display: none;
+  width: min(680px, 100%);
+  margin: 0 auto;
+}
 
-  &.shuffle {
-    mask-image: url('images/shuffle.svg');
-  }
+body.mode-compose .compose-screen,
+body.mode-draw .draw-screen,
+body.mode-result .result-screen {
+  display: block;
+}
 
-  &.megaphone {
-    mask-image: url('images/megaphone.svg');
-  }
+.panel {
+  border-radius: 28px;
+  border: 1px solid var(--panel-border);
+  background: var(--panel);
+  box-shadow: var(--panel-shadow);
+  padding: 20px;
+}
 
-  &.record {
-    mask-image: url('images/record.svg');
-  }
+.panel + .panel,
+.panel + .sticky-cta,
+.state-banner + .panel,
+.compose-header + .state-banner,
+.compose-header + .panel,
+.result-hero + .panel,
+.result-hero + .result-actions {
+  margin-top: 14px;
+}
 
-  &.map {
-    mask-image: url('images/map.svg');
-  }
+.panel-header {
+  padding-top: 22px;
+  padding-bottom: 22px;
+}
 
-  &.trophy {
-    mask-image: url('images/trophy.svg');
-  }
+.compose-header h1,
+.result-hero h1 {
+  margin: 4px 0 0;
+  font-size: 2rem;
+  line-height: 1.14;
+  letter-spacing: -0.02em;
+}
 
-  &.bomb {
-    mask-image: url('images/bomb.svg');
-  }
+.compose-header .subtitle,
+.result-hero .subtitle {
+  margin: 10px 0 0;
+}
 
-  &.sun {
-    mask-image: url('images/sun.svg');
-  }
+.eyebrow,
+.section-label {
+  margin: 0;
+  color: var(--muted-strong);
+  font-size: 0.8rem;
+  font-weight: 700;
+  letter-spacing: 0.02em;
+}
 
-  &.moon {
-    mask-image: url('images/moon.svg');
-  }
+.on-dark {
+  color: rgba(255, 255, 255, 0.88);
 }
 
+h2 {
+  margin: 2px 0 0;
+  font-size: 1.05rem;
+  line-height: 1.28;
+}
 
-#settings {
-  position: fixed;
-  bottom: 1rem;
-  left: 1rem;
-  background: #666;
-  border-radius: 10px;
-  padding: 10px;
-  z-index: 999;
-  min-width: 50%;
+.subtitle,
+.helper-text,
+.cta-subtitle,
+.empty-preset {
+  color: var(--muted);
+  line-height: 1.55;
+}
 
+.section-head {
   display: flex;
-  visibility: visible;
-  opacity: 1;
-  transition: visibility 0s, opacity 1s linear;
+  align-items: flex-start;
+  justify-content: space-between;
+  gap: 12px;
+  margin-bottom: 14px;
+}
 
-  &.hide {
-    opacity: 0;
-    visibility: hidden;
-  }
+.count-badge,
+.status-pill {
+  display: inline-flex;
+  align-items: center;
+  gap: 8px;
+  min-height: 34px;
+  padding: 7px 12px;
+  border-radius: 999px;
+  font-size: 0.82rem;
+  font-weight: 700;
+}
 
-  h3 {
-    padding: 0;
-    margin: 0;
-    font-size: 12pt;
-    color: #fefefe;
-  }
+.count-badge {
+  border: 1px solid var(--line);
+  background: rgba(255, 255, 255, 0.9);
+  color: var(--muted-strong);
+}
 
-  textarea {
-    width: 100%;
-    min-height: 5rem;
-    border: none;
-    background: #999;
-    font-size: 14pt;
-  }
+.state-banner {
+  border-radius: 20px;
+  border: 1px solid var(--line);
+  background: rgba(255, 255, 255, 0.9);
+  padding: 13px 16px;
+  color: var(--muted-strong);
+  line-height: 1.5;
+}
 
-  button, .btn {
-    color: #fefefe;
-    background: #222;
-    border: none;
-    border-radius: 5px;
-    padding: 5px 10px;
-    position: relative;
-    display: inline-block;
-
-    &:active:after {
-      content: '';
-      position: absolute;
-      left: 0;
-      top: 0;
-      right: 0;
-      bottom: 0;
-      background: rgba(0, 0, 0, 0.5);
-    }
-
-    &#btnShop {
-      height: 35px;
-
-      img {
-        width: 25px;
-        height: 25px;
-      }
-    }
-
-    &.new::before {
-      position: absolute;
-      background: #AA0000;
-      color: white;
-      content: 'NEW';
-      font-size: 9px;
-      padding: 2px 4px;
-      right: -10px;
-      top: -4px;
-      border-radius: 6px;
-      z-index: 1;
-    }
-  }
+.state-banner[data-tone='info'] {
+  background: rgba(255, 255, 255, 0.94);
+}
 
-  div.theme {
-    flex-grow: 1;
-    display: flex;
-    align-items: center;
-    color: white;
-    justify-content: flex-end;
-  }
+.state-banner[data-tone='warning'] {
+  background: rgba(255, 255, 255, 0.94);
+  border-color: rgba(78, 89, 104, 0.2);
+}
 
-  div.left {
-    flex-grow: 1;
-    flex-shrink: 1;
-    order: 1;
-
-    .actions {
-      display: flex;
-      align-items: center;
-      justify-content: stretch;
-      gap: 2px;
-
-      div.sep {
-        flex-grow: 1;
-      }
-    }
-  }
+.state-banner[data-tone='error'] {
+  background: rgba(214, 69, 69, 0.08);
+  border-color: rgba(214, 69, 69, 0.18);
+  color: #8d2121;
+}
 
-  .btn-toggle-settings {
-    display: none;
-  }
+.name-input,
+.stepper input,
+.field select {
+  width: 100%;
+  border-radius: 20px;
+  border: 1px solid var(--line);
+  background: rgba(255, 255, 255, 0.98);
+  color: var(--text);
+  padding: 14px 16px;
+  font: inherit;
+  transition: border-color 120ms ease, box-shadow 120ms ease;
+}
 
-  div.right {
-    order: 2;
-    flex-grow: 0;
-    flex-shrink: 0;
-
-    div.row {
-      display: flex;
-      align-items: center;
-      height: 35px;
-
-      label {
-        width: 150px;
-        flex-grow: 0;
-        flex-shrink: 0;
-        padding-left: 1rem;
-        color: white;
-      }
-
-      .toggle-item {
-        width: 50%;
-      }
-    }
-  }
+.name-input:focus,
+.stepper input:focus,
+.field select:focus {
+  outline: none;
+  border-color: rgba(25, 31, 40, 0.35);
+  box-shadow: 0 0 0 4px rgba(25, 31, 40, 0.06);
+}
 
-  select {
-    height: 25px;
-    width: 100%;
-    border-radius: 5px;
-    background: #999;
-  }
+.name-input {
+  min-height: 184px;
+  resize: vertical;
+  line-height: 1.58;
+}
 
-  input[type=checkbox] {
-    width: 50px;
-    display: inline-block;
-    padding-right: 63px;
-    height: 25px;
-    position: relative;
-    vertical-align: middle;
-
-    &:before {
-      position: absolute;
-      content: '';
-      display: inline-block;
-      width: 50px;
-      height: 25px;
-      border-radius: 25px;
-      background: #999;
-      top: 0;
-      left: 0;
-    }
-
-    &:after {
-      position: absolute;
-      top: 0;
-      left: 0;
-      content: '';
-      border-radius: 25px;
-      width: 25px;
-      height: 25px;
-      background: #ccc;
-      transition: transform .2s;
-    }
-
-    &:checked:after {
-      transform: translateX(100%);
-      background: white;
-    }
-
-    &:checked:before {
-      content: '';
-      background: #00baff;
-    }
-  }
+.helper-text {
+  margin: 10px 0 0;
+  font-size: 0.88rem;
+}
 
-  .btn-group {
-    display: flex;
-    justify-content: stretch;
-
-    & > * {
-      box-sizing: border-box;
-      flex-grow: 0;
-      flex-shrink: 0;
-      overflow: hidden;
-      height: 25px;
-      width: 33%;
-      border-radius: 0;
-      background: #999;
-      border: none;
-      padding: 0;
-      color: #fefefe;
-
-      display: flex;
-      align-items: center;
-      justify-content: center;
-
-      &:first-child {
-        border-radius: 10px 0 0 10px;
-      }
-
-      &:last-child {
-        border-radius: 0 10px 10px 0;
-      }
-
-      &.active:before {
-        content: '';
-        width: 15px;
-        height: 15px;
-        display: inline-block;
-        vertical-align: middle;
-        mask-image: url('images/check.svg');
-        mask-repeat: no-repeat;
-        background: white;
-      }
-
-      &.active {
-        background: #333;
-      }
-    }
-
-    input[type=number] {
-      box-sizing: border-box;
-      text-align: center;
-    }
-  }
+.helper-text.is-error {
+  color: var(--danger);
 }
 
-#notice {
-  display: none;
-  position: fixed;
-  overflow: hidden;
-  top: 50%;
-  left: 50%;
-  width: 500px;
-  max-width: 90%;
-  transform: translate(-50%, -50%);
-  background: rgba(255, 255, 255, 0.9);
-  border-radius: 30px;
-  z-index: 1001;
-  padding: 10px 10px;
-  color: #333;
-  flex-direction: column;
+.helper-inline {
+  margin-top: 10px;
+}
 
-  h1 {
-    background-color: #ffdd00;
-    margin: -10px -10px 0 -10px;
-    padding: 10px 5px 10px .5em;
-    border-bottom: 1px solid #333;
-    display: flex;
-    align-items: center;
+.segmented-control {
+  display: grid;
+  grid-template-columns: repeat(3, minmax(0, 1fr));
+  gap: 8px;
+}
 
-    &:before {
-      content: '';
-      display: inline-block;
-      width: 1em;
-      height: 1em;
-      background-image: url('images/megaphone.svg');
-      background-size: contain;
-      margin-right: 0.2em;
-    }
-  }
+.segment,
+.preset-chip,
+.primary-btn,
+.secondary-btn,
+.ghost-btn,
+.stepper-btn {
+  appearance: none;
+  border: none;
+  border-radius: 18px;
+  font: inherit;
+  font-weight: 700;
+  cursor: pointer;
+  transition: background 120ms ease, color 120ms ease, border-color 120ms ease, opacity 120ms ease,
+    transform 120ms ease;
+}
 
-  div.notice-body {
-    padding: 0 .5em;
-  }
+.segment {
+  min-height: 50px;
+  padding: 12px 10px;
+  border: 1px solid transparent;
+  background: #eff1f4;
+  color: var(--muted-strong);
+}
 
-  div.notice-action {
-    display: flex;
-    justify-content: end;
-
-    button {
-      color: #fefefe;
-      background: #222;
-      border: none;
-      border-radius: 20px;
-      padding: 5px 10px;
-      position: relative;
-      overflow: hidden;
-      width: 50%;
-      height: 50px;
-
-      &:active:after {
-        content: '';
-        position: absolute;
-        left: 0;
-        top: 0;
-        right: 0;
-        bottom: 0;
-        background: rgba(0, 0, 0, 0.5);
-      }
-    }
-  }
+.segment.is-selected {
+  background: #191f28;
+  color: white;
 }
 
-@media screen and (max-width: 750px) {
-  #settings {
-    bottom: 60px;
-    display: block;
-    min-width: 0;
-    max-width: 100%;
-    width: calc(100% - 2rem);
-    overflow: hidden;
-    opacity: 1;
-    visibility: visible;
-    transition: visibility 0s, opacity 1s linear;
-
-    &.hide {
-      opacity: 0;
-      visibility: hidden;
-    }
-
-    .btn-toggle-settings {
-      display: flex;
-      align-items: center;
-      justify-content: center;
-      gap: 6px;
-      width: 100%;
-      margin-bottom: 6px;
-      cursor: pointer;
-      font-size: 11pt;
-
-      .toggle-arrow {
-        font-style: normal;
-      }
-    }
-
-    .collapsible-rows.collapsed {
-      display: none;
-    }
-
-    textarea {
-      min-height: 2.5rem;
-      font-size: 11pt;
-    }
-
-    div.right div.row {
-      height: auto;
-      display: block;
-      border-bottom: 1px solid #555;
-      padding: .5rem 0;
-
-      label {
-        width: 100%;
-        margin-bottom: .5rem;
-        padding-left: 0;
-        display: block;
-      }
-
-      &.row-toggles {
-        display: flex;
-        flex-wrap: wrap;
-
-        .toggle-item {
-          width: 50%;
-          display: flex;
-          flex-direction: column;
-          align-items: start;
-        }
-
-        label {
-          order: 0;
-          margin-bottom: .3rem;
-        }
-
-        input[type=checkbox] {
-          order: 1;
-        }
-      }
-
-      &.row-theme {
-        display: none;
-      }
-
-      .icon {
-        width: 15px;
-        height: 15px;
-      }
-    }
-  }
+.custom-rank-wrap {
+  margin-top: 14px;
+}
 
+.custom-rank-wrap label,
+.field span {
+  display: block;
+  margin-bottom: 8px;
+  font-size: 0.88rem;
+  font-weight: 700;
+}
 
-  #notice {
-    position: fixed;
-    box-sizing: border-box;
-    top: 0;
-    left: 0;
-    width: 100%;
-    max-width: 100%;
-    height: 100%;
-    transform: none;
-    background: rgba(255, 255, 255, 0.9);
-    border-radius: 4px;
-    z-index: 1001;
-    padding: 5px 10px;
-    color: #333;
-    display: none;
-    flex-direction: column;
-
-    div.notice-body {
-      flex-grow: 1;
-    }
+.stepper {
+  display: grid;
+  grid-template-columns: 56px minmax(0, 1fr) 56px;
+  gap: 8px;
+  align-items: stretch;
+}
 
-  }
+.stepper input {
+  text-align: center;
+  font-size: 1rem;
+  font-weight: 700;
+}
 
+.stepper-btn {
+  border: 1px solid var(--line);
+  background: rgba(255, 255, 255, 0.98);
+  color: var(--text);
+  font-size: 1.2rem;
 }
 
-div.toast {
-  position: fixed;
-  transform: translate(-50%, 0);
-  padding: 8px;
-  border-radius: 4px;
-  background: #ccc;
-  overflow: hidden;
-  bottom: 10px;
-  left: 50%;
-  z-index: 1000;
-  animation: .2s linear fade-in, .2s linear 1s reverse fade-in;
+.advanced-card {
+  margin-top: 16px;
+  border-radius: 20px;
+  border: 1px solid var(--line);
+  background: rgba(255, 255, 255, 0.82);
 }
 
-@keyframes fade-in {
-  0% {
-    opacity: 0;
-    transform: translate(-50%, 100%);
-  }
+.advanced-card > summary {
+  cursor: pointer;
+  list-style: none;
+  padding: 16px 18px;
+  font-weight: 700;
+}
 
-  100% {
-    opacity: 1;
-    transform: translate(-50%, 0);
-  }
+.advanced-card > summary::-webkit-details-marker {
+  display: none;
+}
+
+.advanced-content {
+  padding: 0 18px 18px;
 }
 
-.link_donation {
+.field select {
+  appearance: none;
+}
+
+.preset-list {
   display: flex;
-  padding: 1em;
-  width: 100%;
-  align-items: center;
+  gap: 10px;
+  overflow-x: auto;
+  padding-bottom: 4px;
+  scrollbar-width: none;
+}
+
+.preset-list::-webkit-scrollbar {
+  display: none;
+}
+
+.preset-chip {
+  display: inline-flex;
+  flex-direction: column;
+  align-items: flex-start;
   justify-content: center;
-  background: repeating-linear-gradient(
-                  45deg,
-                  #ffaa00,
-                  #ffaa00 20px,
-                  #222222 20px,
-                  #222222 40px
-  );
+  min-width: 140px;
+  min-height: 78px;
+  padding: 13px 14px;
+  border: 1px solid var(--line);
+  background: rgba(255, 255, 255, 0.98);
+  color: var(--text);
+  text-align: left;
+}
+
+.preset-chip strong {
+  font-size: 0.94rem;
+}
+
+.preset-chip span {
+  margin-top: 6px;
+  color: var(--muted);
+  font-size: 0.8rem;
+}
+
+.empty-preset {
+  margin: 2px 0 0;
+  padding: 12px 0;
+}
+
+.sticky-cta {
+  position: sticky;
+  bottom: calc(16px + env(safe-area-inset-bottom));
+  display: grid;
+  gap: 14px;
+  border-radius: 26px;
+  border: 1px solid rgba(15, 23, 42, 0.08);
+  background: rgba(255, 255, 255, 0.96);
+  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.12);
+  padding: 16px;
+  backdrop-filter: blur(12px);
+}
+
+.cta-copy .section-label {
+  margin-bottom: 6px;
+}
+
+.cta-title {
+  margin: 0;
+  font-size: 1rem;
+  font-weight: 700;
+}
+
+.cta-subtitle {
+  margin: 4px 0 0;
+}
+
+.primary-btn,
+.secondary-btn,
+.ghost-btn {
+  min-height: 54px;
+  padding: 14px 18px;
+}
+
+.primary-btn {
+  background: #191f28;
   color: white;
-  font-size: 1.5em;
-  font-weight: bold;
-  border-radius: .5em;
-  margin-bottom: 1em;
-  text-decoration: none;
-  text-shadow: -2px 0px black, 0px 2px black, 2px 0px black, 0px -2px black;
 }
 
+.secondary-btn {
+  border: 1px solid var(--line-strong);
+  background: rgba(255, 255, 255, 0.98);
+  color: var(--text);
+}
+
+.ghost-btn {
+  border: 1px solid transparent;
+  background: transparent;
+  color: var(--muted-strong);
+}
+
+.ghost-btn.on-dark,
+.status-pill {
+  border: 1px solid var(--dark-line);
+  background: rgba(10, 12, 16, 0.52);
+  color: var(--dark-text);
+}
+
+.primary-btn:disabled,
+.secondary-btn:disabled,
+.ghost-btn:disabled,
+.stepper-btn:disabled {
+  cursor: not-allowed;
+  opacity: 0.45;
+}
 
-.shop-button {
+.draw-screen {
+  width: min(100%, 720px);
+  min-height: calc(100svh - max(20px, env(safe-area-inset-top)) - 20px);
+}
+
+.draw-overlay {
+  display: flex;
+  flex-direction: column;
+  justify-content: space-between;
+  min-height: calc(100svh - max(20px, env(safe-area-inset-top)) - 20px - env(safe-area-inset-bottom));
+  padding: 4px 0 env(safe-area-inset-bottom);
+}
+
+.draw-topbar {
   display: flex;
-  flex-direction: row;
+  justify-content: space-between;
   align-items: center;
-  justify-content: center;
-  padding: .2em .4em .4em .4em;
-  margin: 0 auto;
-  width: fit-content;
+  gap: 12px;
+}
+
+.dot {
+  width: 4px;
+  height: 4px;
+  border-radius: 999px;
+  background: rgba(255, 255, 255, 0.72);
+}
 
+.draw-card {
+  align-self: flex-start;
+  max-width: 320px;
+  border-radius: 28px;
+  border: 1px solid rgba(255, 255, 255, 0.14);
+  background: var(--dark-surface);
+  color: var(--dark-text);
+  padding: 20px 18px;
+  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
+  backdrop-filter: blur(10px);
+}
+
+.draw-card.is-error {
+  border-color: rgba(214, 69, 69, 0.26);
+  background: rgba(31, 17, 17, 0.8);
+}
+
+.draw-card h2 {
+  margin: 6px 0 8px;
+  font-size: 1.45rem;
+  line-height: 1.2;
+}
+
+.draw-card p:last-child {
+  margin-bottom: 0;
+}
+
+.draw-actions {
+  display: grid;
+  gap: 10px;
+  margin-top: 16px;
+}
+
+.result-hero {
+  background: rgba(255, 255, 255, 0.96);
+}
+
+.ranking-list {
+  list-style: none;
+  padding: 0;
+  margin: 0;
+  display: grid;
+  gap: 8px;
+}
+
+.ranking-item {
+  display: grid;
+  grid-template-columns: 44px minmax(0, 1fr) auto;
+  gap: 12px;
+  align-items: center;
+  padding: 14px 16px;
+  border-radius: 20px;
+  border: 1px solid rgba(15, 23, 42, 0.08);
+  background: rgba(255, 255, 255, 0.92);
+}
+
+.ranking-item.is-winner {
+  border-color: rgba(25, 31, 40, 0.18);
+  background: rgba(25, 31, 40, 0.06);
+}
+
+.ranking-item.is-empty {
+  grid-template-columns: 1fr;
+  color: var(--muted);
+}
+
+.ranking-number {
+  font-size: 0.9rem;
+  font-weight: 700;
+  color: var(--muted-strong);
+}
+
+.ranking-name {
+  min-width: 0;
+  font-weight: 700;
+  word-break: break-word;
+}
+
+.ranking-badge {
+  color: var(--muted-strong);
+  font-size: 0.82rem;
+  font-weight: 700;
+}
+
+.result-actions {
+  display: grid;
+  gap: 10px;
+  margin-top: 14px;
+}
+
+.toast {
+  position: fixed;
+  left: 50%;
+  bottom: calc(24px + env(safe-area-inset-bottom));
+  transform: translateX(-50%) translateY(16px);
+  min-width: 180px;
+  max-width: calc(100vw - 32px);
+  border-radius: 999px;
+  background: rgba(17, 19, 24, 0.92);
   color: white;
-  font-size: 32px;
-  line-height: 48px;
-  font-weight: bold;
-  text-decoration: none;
-
-  img {
-    width: 48px;
-    height: 48px;
-    margin-right: .2em;
-    margin-bottom: -4px;
+  text-align: center;
+  padding: 12px 18px;
+  z-index: 20;
+  opacity: 0;
+  pointer-events: none;
+  transition: opacity 180ms ease, transform 180ms ease;
+}
+
+.toast.is-visible {
+  opacity: 1;
+  transform: translateX(-50%) translateY(0);
+}
+
+.is-hidden {
+  display: none;
+}
+
+@media (min-width: 768px) {
+  .app-shell {
+    padding-left: 20px;
+    padding-right: 20px;
   }
 
-  background-color: #0077ff;
-  border: 2px solid black;
-  border-radius: 10px;
+  .sticky-cta {
+    grid-template-columns: 1fr auto;
+    align-items: center;
+  }
+
+  .primary-btn {
+    min-width: 168px;
+  }
+
+  .result-actions {
+    grid-template-columns: repeat(3, minmax(0, 1fr));
+  }
 }
diff --git a/index.html b/index.html
index 34e0b47..abc2f42 100644
--- a/index.html
+++ b/index.html
@@ -1,414 +1,145 @@
 <!DOCTYPE html>
-<html lang="en">
+<html lang="ko">
 <head>
   <meta charset="UTF-8">
   <meta http-equiv="X-UA-Compatible" content="ie=edge">
-  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5899C1DJM0"></script>
-  <script defer src="https://umami.lazygyu.net/script.js" data-website-id="205aee0d-30b6-4c69-a053-0c72c8377be0"></script>
-
-  <title>Marble Roulette</title>
-  <meta name="viewport" content="width=device-width, initial-scale=1.0">
-  <link rel="apple-touch-icon" sizes="57x57" href="assets/apple-icon-57x57.png">
-  <link rel="apple-touch-icon" sizes="60x60" href="assets/apple-icon-60x60.png">
-  <link rel="apple-touch-icon" sizes="72x72" href="assets/apple-icon-72x72.png">
-  <link rel="apple-touch-icon" sizes="76x76" href="assets/apple-icon-76x76.png">
-  <link rel="apple-touch-icon" sizes="114x114" href="assets/apple-icon-114x114.png">
-  <link rel="apple-touch-icon" sizes="120x120" href="assets/apple-icon-120x120.png">
-  <link rel="apple-touch-icon" sizes="144x144" href="assets/apple-icon-144x144.png">
-  <link rel="apple-touch-icon" sizes="152x152" href="assets/apple-icon-152x152.png">
-  <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-icon-180x180.png">
-  <link rel="icon" type="image/png" sizes="192x192" href="assets/android-icon-192x192.png">
+  <title>The Rullet | 마블 추첨</title>
+  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
+  <meta name="description" content="참여자를 빠르게 정리하고 공정하게 결과를 확인하는 모바일용 마블 추첨 도구.">
   <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">
-  <link rel="icon" type="image/png" sizes="96x96" href="assets/favicon-96x96.png">
-  <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16x16.png">
-  <link rel="manifest" href="assets/manifest.json">
-
-  <meta name="msapplication-TileColor" content="#ffffff">
-  <meta name="msapplication-TileImage" content="assets/ms-icon-144x144.png">
-  <meta name="theme-color" content="#ffffff">
-
-  <meta name="description" content="A lucky draw by dropping marbles, made by lazygyu">
-  <meta property="og:url" content="https://lazygyu.github.io/roulette/">
-  <meta property="og:title" content="Marble Roulette">
-  <meta property="og:description" content="A lucky draw by dropping marbles, made by lazygyu">
-  <meta property="og:site_name" content="lazygyu.github.io">
-  <meta property="og:type" content="website">
-
-  <link rel='stylesheet' href='assets/style.scss' />
+  <link rel="stylesheet" href="assets/style.scss">
 </head>
-<body>
-<script type="module" src="./src/index.ts"></script>
-<script type="text/javascript">
-  window.dataLayer = window.dataLayer || [];
-
-  function gtag() {
-    dataLayer.push(arguments);
-  }
-
-  gtag('js', new Date());
-  gtag('config', 'G-5899C1DJM0');
-
-  function getNames() {
-    const value = document.querySelector('#in_names').value.trim();
-    return value.split(/[,\r\n]/g).map(v => v.trim()).filter(v => !!v);
-  }
-
-  function parseName(nameStr) {
-    const weightRegex = /(\/\d+)/;
-    const countRegex = /(\*\d+)/;
-    const hasWeight = weightRegex.test(nameStr);
-    const hasCount = countRegex.test(nameStr);
-    const name = /^\s*([^\/*]+)?/.exec(nameStr)[1];
-    const weight = hasWeight ? parseInt(weightRegex.exec(nameStr)[1].replace('/', '')) : 1;
-    const count = hasCount ? parseInt(countRegex.exec(nameStr)[1].replace('*', '')) : 1;
-    return {
-      name,
-      weight,
-      count,
-    };
-  }
-
-  function getReady() {
-    const names = getNames();
-    window.roulette.setMarbles(names);
-    ready = names.length > 0;
-    localStorage.setItem('mbr_names', names.join(','));
-    switch (winnerType) {
-      case 'first':
-        setWinnerRank(1);
-        break;
-      case 'last':
-        const total = window.roulette.getCount();
-        setWinnerRank(total);
-        break;
-    }
-  }
-
-  function setWinnerRank(rank) {
-    document.querySelector('#in_winningRank').value = rank;
-    window.options.winningRank = rank - 1;
-    window.roulette.setWinningRank(window.options.winningRank);
-
-    if (winnerType === 'first') {
-      document.querySelector('.btn-first-winner').classList.toggle('active', true);
-      document.querySelector('.btn-last-winner').classList.toggle('active', false);
-      document.querySelector('#in_winningRank').classList.toggle('active', false);
-    } else if (winnerType === 'last') {
-      document.querySelector('.btn-first-winner').classList.toggle('active', false);
-      document.querySelector('.btn-last-winner').classList.toggle('active', true);
-      document.querySelector('#in_winningRank').classList.toggle('active', false);
-    } else if (winnerType === 'custom') {
-      document.querySelector('.btn-first-winner').classList.toggle('active', false);
-      document.querySelector('.btn-last-winner').classList.toggle('active', false);
-      document.querySelector('#in_winningRank').classList.toggle('active', true);
-    }
-  }
-
-
-  let ready = false;
-  let winnerType = 'first';
-
-  document.addEventListener('DOMContentLoaded', () => {
-    initialize();
-  });
-
-  function initialize() {
-    if (!window.roulette || !window.roulette.isReady) {
-      console.log('does not loaded yet');
-      setTimeout(initialize, 100);
-      return;
-    }
-    console.log('initializing start');
-
-    const urlParams = new URLSearchParams(window.location.search);
-    const namesFromUrl = urlParams.get('names');
-
-    if (namesFromUrl) {
-      document.querySelector('#in_names').value = namesFromUrl.replace(/,/g, '\n');
-    } else {
-      const savedNames = localStorage.getItem('mbr_names');
-      if (savedNames) {
-        document.querySelector('#in_names').value = savedNames;
-      }
-    }
-    document.querySelector('#in_names').addEventListener('input', () => {
-      getReady();
-    });
-
-    document.querySelector('#in_names').addEventListener('blur', () => {
-      const nameSource = getNames();
-      const nameSet = new Set();
-      const nameCounts = {};
-      nameSource.forEach(nameSrc => {
-        const name = parseName(nameSrc);
-        const key = name.weight > 1 ? `${name.name}/${name.weight}` : name.name;
-        if (!nameSet.has(key)) {
-          nameSet.add(key);
-          nameCounts[key] = 0;
-        }
-        nameCounts[key] += name.count;
-      });
-      const result = [];
-      Object.keys(nameCounts).forEach(key => {
-        if (nameCounts[key] > 1) {
-          result.push(`${key}*${nameCounts[key]}`);
-        } else {
-          result.push(key);
-        }
-      });
-
-      const oldValue = document.querySelector('#in_names').value;
-      const newValue = result.join(',');
-
-      if (oldValue !== newValue) {
-        document.querySelector('#in_names').value = newValue;
-        getReady();
-      }
-    });
-
-    document.querySelector('#btnShuffle').addEventListener('click', () => {
-      getReady();
-    });
-
-    document.querySelector('#btnStart').addEventListener('click', () => {
-      if (!ready) return;
-      gtag && gtag('event', 'start', {
-        'event_category': 'roulette',
-        'event_label': 'start',
-        'value': window.roulette.getCount(),
-      });
-      const names = getNames();
-      const marbles = names.map(n => {
-        const p = parseName(n);
-        return { name: p.name, count: p.count };
-      });
-      if (typeof umami !== 'undefined') {
-        umami.track('start', { count: window.roulette.getCount() });
-        marbles.forEach(m => {
-          umami.track('marble', { name: m.name, count: m.count });
-        });
-      }
-      window.roulette.start();
-      document.querySelector('#settings').classList.add('hide');
-      document.querySelector('#donate').classList.add('hide');
-    });
-
-    document.querySelector('#chkAutoRecording').addEventListener('change', (e) => {
-      window.options.autoRecording = e.target.matches(':checked');
-      window.roulette.setAutoRecording(window.options.autoRecording);
-    });
-
-    document.querySelector('#chkSkill').addEventListener('change', (e) => {
-      window.options.useSkills = e.target.matches(':checked');
-      window.roulette.setWinningRank(window.options.winningRank);
-    });
-
-    document.querySelector('#chkDarkMode').addEventListener('change', (e) => {
-      window.options.darkMode = e.target.matches(':checked');
-      window.roulette.setTheme(window.options.darkMode ? 'dark' : 'light');
-      document.documentElement.classList.toggle('light', !window.options.darkMode);
-    });
-
-    document.querySelector('#in_winningRank').addEventListener('change', (e) => {
-      const v = parseInt(e.target.value, 10);
-      winnerType = 'custom';
-      setWinnerRank(isNaN(v) ? 0 : v);
-    });
-
-    document.querySelector('.btn-last-winner').addEventListener('click', () => {
-      const total = window.roulette.getCount();
-      winnerType = 'last';
-      setWinnerRank(total);
-    });
-    document.querySelector('.btn-first-winner').addEventListener('click', () => {
-      winnerType = 'first';
-      setWinnerRank(1);
-    });
-
-    window.roulette.addEventListener('goal', () => {
-      ready = false;
-      setTimeout(() => {
-        document.querySelector('#settings').classList.remove('hide');
-        document.querySelector('#donate').classList.remove('hide');
-      }, 3000);
-    });
-
-    window.roulette.addEventListener('message', (e) => {
-      simpleToast(e.detail);
-    });
-
-    const toggleBtn = document.querySelector('#btnToggleSettings');
-    const collapsible = document.querySelector('.collapsible-rows');
-    toggleBtn.addEventListener('click', () => {
-      collapsible.classList.toggle('collapsed');
-      toggleBtn.querySelector('.toggle-arrow').textContent =
-        collapsible.classList.contains('collapsed') ? '▲' : '▼';
-    });
-
-    document.querySelector('#btnShuffle').click();
-
-    const maps = window.roulette.getMaps();
-    const mapSelector = document.querySelector('#sltMap');
-    maps.forEach((map) => {
-      const option = document.createElement('option');
-      option.value = map.index;
-      option.innerHTML = map.title;
-      option.setAttribute('data-trans', '');
-      window.translateElement(option);
-      mapSelector.append(option);
-    });
-    mapSelector.addEventListener('change', (e) => {
-      const index = e.target.value;
-      window.roulette.setMap(index);
-    });
-
-    // const checkDonateButtonLoaded = () => {
-    //   const btn = document.querySelector('span.bmc-btn-text');
-    //   if (!btn) {
-    //     setTimeout(checkDonateButtonLoaded, 100);
-    //   } else {
-    //     console.log('donation button has been loaded');
-    //     btn.setAttribute('data-trans', '');
-    //     window.translateElement(btn);
-    //   }
-    // };
-    // setTimeout(checkDonateButtonLoaded, 100);
-
-    const currentNotice = 5;
-    const noticeKey = 'lastViewedNotification';
-
-    const closeNotice = () => {
-      document.querySelector('#notice').style.display = 'none';
-      localStorage.setItem(noticeKey, currentNotice.toString());
-    };
-
-    const openNotice = () => {
-      console.log('openNotice');
-      document.querySelector('#notice').style.display = 'flex';
-    };
-
-    document.querySelector('#closeNotice').addEventListener('click', () => {
-      closeNotice();
-    });
-
-    document.querySelector('#btnNotice').addEventListener('click', () => {
-      openNotice();
-    });
-
-    function simpleToast(msg) {
-      const toast = document.createElement('div');
-      toast.classList.add('toast');
-      toast.innerHTML = msg;
-
-      if (window.translateElement) {
-        console.log('try to translate');
-        window.translateElement(toast);
-      }
-
-      document.body.appendChild(toast);
-      setTimeout(() => {
-        document.body.removeChild(toast);
-      }, 1200);
-    }
+<body class="mode-compose">
+<main class="app-shell" aria-live="polite">
+  <section class="screen compose-screen" data-screen="compose">
+    <header class="compose-header panel panel-header">
+      <p class="eyebrow">Compose</p>
+      <h1>마블 추첨</h1>
+      <p class="subtitle">참여자를 정리하고, 공정한 결과를 빠르게 확인하세요.</p>
+    </header>
+
+    <div id="composeState" class="state-banner is-hidden" role="status" aria-live="polite"></div>
+
+    <section class="panel">
+      <div class="section-head">
+        <div>
+          <p class="section-label">참여자</p>
+          <h2>이름 목록</h2>
+        </div>
+        <span id="participantCount" class="count-badge">0명</span>
+      </div>
 
-    const checkNotice = () => {
-      const lastViewed = localStorage.getItem(noticeKey);
-      console.log('lastViewed', lastViewed);
-      if (lastViewed === null || Number(lastViewed) < currentNotice) {
-        openNotice();
-      }
-    };
+      <textarea
+        id="inNames"
+        class="name-input"
+        placeholder="줄바꿈이나 쉼표로 여러 명을 입력하세요&#10;예: 토스, 추첨/3, 검증*2"
+        spellcheck="false"
+      ></textarea>
+      <p id="inputHelper" class="helper-text">이름을 1명 이상 입력해 주세요.</p>
+    </section>
+
+    <section class="panel">
+      <p class="section-label">선정 방식</p>
+      <div id="winnerModeControl" class="segmented-control" role="radiogroup" aria-label="선정 방식">
+        <button type="button" class="segment is-selected" data-mode="first">1등</button>
+        <button type="button" class="segment" data-mode="last">마지막</button>
+        <button type="button" class="segment" data-mode="custom">직접 선택</button>
+      </div>
 
-    checkNotice();
-  }
-</script>
-<div id="settings" class="settings">
-  <div class="right">
-    <button id="btnToggleSettings" class="btn-toggle-settings">
-      <span data-trans>Settings</span>
-      <i class="toggle-arrow">▲</i>
-    </button>
-    <div class="collapsible-rows collapsed">
-      <div class="row">
-        <label for='sltMap'>
-          <i class="icon map"></i>
-          <span data-trans>Map</span>
-        </label>
-        <select id="sltMap"></select>
+      <div id="customRankWrap" class="custom-rank-wrap is-hidden">
+        <label for="inWinningRank">선택할 순위</label>
+        <div class="stepper">
+          <button id="btnCustomRankDown" type="button" class="stepper-btn" aria-label="순위 낮추기">−</button>
+          <input id="inWinningRank" type="number" min="1" value="1" inputmode="numeric">
+          <button id="btnCustomRankUp" type="button" class="stepper-btn" aria-label="순위 높이기">＋</button>
+        </div>
+        <p id="customRankHelper" class="helper-text helper-inline is-hidden"></p>
       </div>
-      <div class="row row-toggles">
-        <div class='toggle-item'>
-          <label for='chkAutoRecording'>
-            <i class="icon record"></i>
-            <span data-trans>Recording</span>
+
+      <details class="advanced-card">
+        <summary>고급 옵션</summary>
+        <div class="advanced-content">
+          <label class="field">
+            <span>트랙 레이아웃</span>
+            <select id="sltMap"></select>
           </label>
-          <input type="checkbox" id="chkAutoRecording" />
         </div>
-        <div class='toggle-item'>
-          <label for='chkSkill'>
-            <i class="icon bomb"></i>
-            <span data-trans>Using skills</span>
-          </label>
-          <input type="checkbox" id="chkSkill" checked />
+      </details>
+    </section>
+
+    <section class="panel panel-presets">
+      <div class="section-head">
+        <div>
+          <p class="section-label">최근 구성</p>
+          <h2>빠르게 다시 쓰기</h2>
         </div>
+        <button id="btnClearPresets" type="button" class="ghost-btn" disabled>지우기</button>
       </div>
-      <div class="row">
-        <label>
-          <i class="icon trophy"></i>
-          <span data-trans>The winner is</span>
-        </label>
-        <div class="btn-group">
-          <button class="btn-winner btn-first-winner active" data-trans>First</button>
-          <button class="btn-winner btn-last-winner" data-trans>Last</button>
-          <input type="number" id="in_winningRank" value="1" min="1" />
+      <div id="presetList" class="preset-list" aria-label="최근 참여자 구성"></div>
+    </section>
+
+    <section class="sticky-cta">
+      <div class="cta-copy">
+        <p class="section-label">준비 상태</p>
+        <p id="ctaTitle" class="cta-title">참여자를 입력해 주세요</p>
+        <p id="ctaHelper" class="cta-subtitle">입력이 끝나면 바로 추첨을 시작할 수 있어요.</p>
+      </div>
+      <button id="btnStart" type="button" class="primary-btn" disabled>추첨 시작</button>
+    </section>
+  </section>
+
+  <section class="screen draw-screen" data-screen="draw">
+    <div class="draw-overlay">
+      <div class="draw-topbar">
+        <div class="status-pill">
+          <span id="drawStatusCount">0명</span>
+          <span class="dot" aria-hidden="true"></span>
+          <span id="drawStatusMode">1등</span>
         </div>
+        <button id="btnExitDraw" type="button" class="ghost-btn on-dark">편집</button>
       </div>
-      <div class="row row-theme">
-        <div class='theme'>
-          <i class='icon sun'></i>
-          <input type='checkbox' id='chkDarkMode' checked />
-          <i class='icon moon'></i>
+
+      <div id="drawStateCard" class="draw-card" role="status" aria-live="polite">
+        <p id="drawEyebrow" class="eyebrow on-dark">Draw</p>
+        <h2 id="drawHeadline">추첨 준비 중이에요</h2>
+        <p id="drawSubline">결과는 자동으로 열려요.</p>
+        <div id="drawErrorActions" class="draw-actions is-hidden">
+          <button id="btnRetryDraw" type="button" class="primary-btn">다시 시도</button>
+          <button id="btnReturnCompose" type="button" class="ghost-btn on-dark">참여자 편집</button>
         </div>
       </div>
     </div>
-  </div>
-  <div class="left">
-    <h3 data-trans>Enter names below</h3>
-    <textarea id="in_names" placeholder="Input names separated by commas or line feed here" data-trans="placeholder">수박*2,키위*2,귤*2</textarea>
-    <div class="actions">
-      <button id="btnNotice">
-        <i class="icon megaphone"></i>
-      </button>
-      <a href='https://marblerouletteshop.com' target='_blank' id="btnShop" class='btn new' title='MarbleRoulette Shop'>
-        <img src='assets/images/marblerouletteshop.png' />
-      </a>
-      <div class="sep"></div>
-      <button id="btnShuffle">
-        <i class="icon shuffle"></i>
-        <span data-trans>Shuffle</span>
-      </button>
-      <button id="btnStart">
-        <i class="icon play"></i>
-        <span data-trans>Start</span>
-      </button>
-    </div>
-  </div>
-</div>
-<div id="notice">
-  <h1>Notice</h1>
-  <div class="notice-body">
-    <h2>커스텀 룰렛 기능 오픈!</h2>
-    <p>나만의 특별한 룰렛을 만들 수 있는 커스텀 룰렛 기능이 오픈했어요!</p>
-    <p>
-      <a href='https://marblerouletteshop.com/intro/roulette' target='_blank' class='shop-button holographic'><img
-        src='assets/images/marblerouletteshop.png' width='125' height='125' /> 룰렛 꾸미러 가기</a>
-    </p>
-  </div>
-  <div class="notice-action">
-    <button id="closeNotice" data-trans>Close</button>
-  </div>
-</div>
-<div class="copyright">&copy; 2022-2026.<a href="https://lazygyu.net" target="_blank">lazygyu</a> <span data-trans>This program is freeware and may be used freely anywhere, including in broadcasts and videos.</span>
-</div>
+  </section>
+
+  <section class="screen result-screen" data-screen="result">
+    <header class="result-hero panel panel-header">
+      <p class="eyebrow">Result</p>
+      <h1 id="resultWinner">결과 없음</h1>
+      <p id="resultMeta" class="subtitle">추첨 결과가 여기에 표시돼요.</p>
+    </header>
+
+    <section class="panel">
+      <div class="section-head">
+        <div>
+          <p class="section-label">전체 순위</p>
+          <h2>도착 순서</h2>
+        </div>
+        <span id="rankingCount" class="count-badge">0명</span>
+      </div>
+
+      <ol id="resultList" class="ranking-list"></ol>
+    </section>
+
+    <section class="result-actions">
+      <button id="btnRerun" type="button" class="primary-btn">한 번 더 추첨</button>
+      <button id="btnEditNames" type="button" class="secondary-btn">이름 편집</button>
+      <button id="btnCopyResult" type="button" class="ghost-btn">결과 복사</button>
+    </section>
+  </section>
+</main>
+
+<div id="toast" class="toast" role="status" aria-live="polite"></div>
+
+<script type="module" src="./src/index.ts"></script>
 </body>
 </html>
diff --git a/src/data/constants.ts b/src/data/constants.ts
index b0bc789..cd5a94f 100644
--- a/src/data/constants.ts
+++ b/src/data/constants.ts
@@ -25,70 +25,75 @@ export const DefaultBloomColor = {
 
 export const Themes: Record<string, ColorTheme> = {
   light: {
-    background: '#eee',
-    marbleLightness: 50,
-    marbleWinningBorder: 'black',
-    skillColor: '#69c',
-    coolTimeIndicator: '#999',
+    background: '#f5f6f8',
+    marbleLightness: 72,
+    marbleSaturation: 10,
+    marbleLabelFill: '#191f28',
+    marbleLabelStroke: 'rgba(255, 255, 255, 0.95)',
+    marbleWinningBorder: '#191f28',
+    skillColor: '#6b7684',
+    coolTimeIndicator: '#8b95a1',
     entity: {
       box: {
-        fill: '#226f92',
-        outline: 'black',
-        bloom: 'cyan',
+        fill: '#d7dde4',
+        outline: '#58616a',
+        bloom: '#d7dde4',
         bloomRadius: 0,
       },
       circle: {
-        fill: 'yellow',
-        outline: '#ed7e11',
-        bloom: 'yellow',
+        fill: '#e9edf2',
+        outline: '#58616a',
+        bloom: '#e9edf2',
         bloomRadius: 0,
       },
       polyline: {
-        fill: 'white',
-        outline: 'black',
-        bloom: 'cyan',
+        fill: '#f8fafc',
+        outline: '#58616a',
+        bloom: '#f8fafc',
         bloomRadius: 0,
       },
     },
-    rankStroke: 'black',
-    minimapBackground: '#fefefe',
-    minimapViewport: '#6699cc',
-
-    winnerBackground: 'rgba(255, 255, 255, 0.5)',
-    winnerOutline: 'black',
-    winnerText: '#cccccc',
+    rankStroke: '#f8fafc',
+    minimapBackground: '#f8fafc',
+    minimapViewport: '#6b7684',
+    winnerBackground: 'rgba(255, 255, 255, 0.74)',
+    winnerOutline: 'rgba(25, 31, 40, 0.08)',
+    winnerText: '#191f28',
   },
   dark: {
-    background: 'black',
-    marbleLightness: 75,
-    marbleWinningBorder: 'white',
-    skillColor: 'white',
-    coolTimeIndicator: 'red',
+    background: '#05070a',
+    marbleLightness: 70,
+    marbleSaturation: 8,
+    marbleLabelFill: 'rgba(248, 250, 252, 0.92)',
+    marbleLabelStroke: 'rgba(5, 7, 10, 0.95)',
+    marbleWinningBorder: '#ffffff',
+    skillColor: '#8b95a1',
+    coolTimeIndicator: '#8b95a1',
     entity: {
       box: {
-        fill: 'cyan',
-        outline: 'cyan',
-        bloom: 'cyan',
-        bloomRadius: 15,
+        fill: '#1a1d21',
+        outline: '#636b74',
+        bloom: '#9aa4af',
+        bloomRadius: 0,
       },
       circle: {
-        fill: 'yellow',
-        outline: 'yellow',
-        bloom: 'yellow',
-        bloomRadius: 15,
+        fill: '#12161b',
+        outline: '#7b848e',
+        bloom: '#b0bac4',
+        bloomRadius: 0,
       },
       polyline: {
-        fill: 'white',
-        outline: 'white',
-        bloom: 'cyan',
-        bloomRadius: 15,
+        fill: '#f4f6f8',
+        outline: '#7b848e',
+        bloom: '#f4f6f8',
+        bloomRadius: 0,
       },
     },
-    rankStroke: '',
-    minimapBackground: '#333333',
-    minimapViewport: 'white',
-    winnerBackground: 'rgba(0, 0, 0, 0.5)',
-    winnerOutline: 'black',
-    winnerText: 'white',
+    rankStroke: 'rgba(5, 7, 10, 0.92)',
+    minimapBackground: '#14181d',
+    minimapViewport: '#8b95a1',
+    winnerBackground: 'rgba(10, 12, 16, 0.78)',
+    winnerOutline: 'rgba(255, 255, 255, 0.12)',
+    winnerText: '#f8fafc',
   },
 };
diff --git a/src/marble.ts b/src/marble.ts
index d91a139..03aa701 100644
--- a/src/marble.ts
+++ b/src/marble.ts
@@ -66,7 +66,7 @@ export class Marble {
     const line = Math.floor(order / 10);
     const lineDelta = -Math.max(0, Math.ceil(maxLine - 5));
     this.hue = (360 / max) * order;
-    this.color = `hsl(${this.hue} 100% 70%)`;
+    this.color = `hsl(${this.hue} 10% 72%)`;
     this.id = order;
 
     physics.createMarble(order, 10.25 + (order % 10) * 0.6, maxLine - line + lineDelta);
@@ -151,7 +151,7 @@ export class Marble {
   private _renderNormal(ctx: CanvasRenderingContext2D, zoom: number, outline: boolean, skin?: CanvasImageSource) {
     const hs = this.size / 2;
 
-    ctx.fillStyle = `hsl(${this.hue} 100% ${this.theme.marbleLightness + 25 * Math.min(1, this.impact / 500)}%`;
+    ctx.fillStyle = `hsl(${this.hue} ${this.theme.marbleSaturation}% ${this.theme.marbleLightness + 25 * Math.min(1, this.impact / 500)}%)`;
 
     // ctx.shadowColor = this.color;
     // ctx.shadowBlur = zoom / 2;
@@ -180,10 +180,10 @@ export class Marble {
 
   private _drawName(ctx: CanvasRenderingContext2D, zoom: number) {
     transformGuard(ctx, () => {
-      ctx.font = `12pt sans-serif`;
-      ctx.strokeStyle = 'black';
+      ctx.font = `600 11pt sans-serif`;
+      ctx.strokeStyle = this.theme.marbleLabelStroke;
       ctx.lineWidth = 2;
-      ctx.fillStyle = this.color;
+      ctx.fillStyle = this.theme.marbleLabelFill;
       ctx.shadowBlur = 0;
       ctx.translate(this.x, this.y + 0.25);
       ctx.scale(1 / zoom, 1 / zoom);
diff --git a/src/roulette.ts b/src/roulette.ts
index 56a067f..6e4e9c0 100644
--- a/src/roulette.ts
+++ b/src/roulette.ts
@@ -5,11 +5,9 @@ import { FastForwader } from './fastForwader';
 import type { GameObject } from './gameObject';
 import type { IPhysics } from './IPhysics';
 import { Marble } from './marble';
-import { Minimap } from './minimap';
 import options from './options';
 import { ParticleManager } from './particleManager';
 import { Box2dPhysics } from './physics-box2d';
-import { RankRenderer } from './rankRenderer';
 import { RouletteRenderer } from './rouletteRenderer';
 import { SkillEffect } from './skillEffect';
 import type { ColorTheme } from './types/ColorTheme';
@@ -17,7 +15,12 @@ import type { MouseEventHandlerName, MouseEventName } from './types/mouseEvents.
 import type { UIObject } from './UIObject';
 import { bound } from './utils/bound.decorator';
 import { parseName, shuffle } from './utils/utils';
-import { VideoRecorder } from './utils/videoRecorder';
+
+export type RouletteLeaderboardEntry = {
+  rank: number;
+  name: string;
+  isWinner: boolean;
+};
 
 export class Roulette extends EventTarget {
   private _marbles: Marble[] = [];
@@ -39,16 +42,12 @@ export class Roulette extends EventTarget {
   private _effects: GameObject[] = [];
 
   private _winnerRank = 0;
-  private _totalMarbleCount = 0;
   private _goalDist: number = Infinity;
   private _isRunning: boolean = false;
   private _winner: Marble | null = null;
 
   private _uiObjects: UIObject[] = [];
 
-  private _autoRecording: boolean = false;
-  private _recorder!: VideoRecorder;
-
   private physics!: IPhysics;
 
   private _isReady: boolean = false;
@@ -70,18 +69,47 @@ export class Roulette extends EventTarget {
   constructor() {
     super();
     this._renderer = this.createRenderer();
-    this._renderer.init().then(() => {
-      this._init().then(() => {
-        this._isReady = true;
-        this._update();
-      });
-    });
+    void this._bootstrap();
+  }
+
+  private async _bootstrap() {
+    try {
+      await this._renderer.init();
+      await this._init();
+      this._isReady = true;
+      this.dispatchEvent(new CustomEvent('ready'));
+      this._update();
+    } catch (error) {
+      console.error('Failed to initialize roulette engine', error);
+      this.dispatchEvent(
+        new CustomEvent('initerror', {
+          detail: {
+            error: error instanceof Error ? error.message : 'Unknown roulette initialization error',
+          },
+        })
+      );
+    }
   }
 
   public getZoom() {
     return initialZoom * this._camera.zoom;
   }
 
+  public getWinnerName() {
+    return this._winner?.name ?? null;
+  }
+
+  public getLeaderboard(): RouletteLeaderboardEntry[] {
+    const winnerSet = new Set(this._winners);
+    const remainingMarbles = this._marbles.filter((marble) => !winnerSet.has(marble));
+    const ordered = [...this._winners, ...remainingMarbles];
+    return ordered.map((marble, index) => ({
+      rank: index + 1,
+      name: marble.name,
+      isWinner: marble === this._winner,
+    }));
+  }
+
   private addUiObject(obj: UIObject) {
     this._uiObjects.push(obj);
     if (obj.onWheel) {
@@ -147,29 +175,18 @@ export class Roulette extends EventTarget {
       if (marble.y > this._stage.goalY) {
         this._winners.push(marble);
         if (this._isRunning && this._winners.length === this._winnerRank + 1) {
-          this.dispatchEvent(new CustomEvent('goal', { detail: { winner: marble.name } }));
           this._winner = marble;
           this._isRunning = false;
-          this._particleManager.shot(this._renderer.width, this._renderer.height);
-          setTimeout(() => {
-            this._recorder.stop();
-          }, 1000);
-        } else if (
-          this._isRunning &&
-          this._winnerRank === this._winners.length &&
-          this._winnerRank === this._totalMarbleCount - 1
-        ) {
           this.dispatchEvent(
             new CustomEvent('goal', {
-              detail: { winner: this._marbles[i + 1].name },
+              detail: {
+                winner: marble.name,
+                winnerRank: this._winnerRank + 1,
+                ranking: this.getRanking().map((entry) => entry.name),
+              },
             })
           );
-          this._winner = this._marbles[i + 1];
-          this._isRunning = false;
           this._particleManager.shot(this._renderer.width, this._renderer.height);
-          setTimeout(() => {
-            this._recorder.stop();
-          }, 1000);
         }
         setTimeout(() => {
           this.physics.removeMarble(marble.id);
@@ -182,15 +199,18 @@ export class Roulette extends EventTarget {
     this._goalDist = Math.abs(this._stage.zoomY - topY);
     this._timeScale = this._calcTimeScale();
 
-    this._marbles = this._marbles.filter((marble) => marble.y <= this._stage?.goalY);
+    const goalY = this._stage.goalY;
+    this._marbles = this._marbles.filter((marble) => marble.y <= goalY);
   }
 
   private _calcTimeScale(): number {
     if (!this._stage) return 1;
     const targetIndex = this._winnerRank - this._winners.length;
+    const targetMarble = this._marbles[targetIndex];
     if (this._winners.length < this._winnerRank + 1 && this._goalDist < zoomThreshold) {
       if (
-        this._marbles[targetIndex].y > this._stage.zoomY - zoomThreshold * 1.2 &&
+        targetMarble &&
+        targetMarble.y > this._stage.zoomY - zoomThreshold * 1.2 &&
         (this._marbles[targetIndex - 1] || this._marbles[targetIndex + 1])
       ) {
         return Math.max(0.2, this._goalDist / zoomThreshold);
@@ -223,23 +243,10 @@ export class Roulette extends EventTarget {
   }
 
   private async _init() {
-    this._recorder = new VideoRecorder(this._renderer.canvas);
-
     this.physics = new Box2dPhysics();
     await this.physics.init();
 
-    this.addUiObject(new RankRenderer());
     this.attachEvent();
-    const minimap = new Minimap();
-    minimap.onViewportChange((pos) => {
-      if (pos) {
-        this._camera.setPosition(pos, false);
-        this._camera.lock(true);
-      } else {
-        this._camera.lock(false);
-      }
-    });
-    this.addUiObject(minimap);
     this.fastForwarder = this.createFastForwader();
     this.addUiObject(this.fastForwarder);
     this._stage = stages[0];
@@ -311,22 +318,17 @@ export class Roulette extends EventTarget {
   }
 
   public start() {
+    if (!this._isReady) {
+      throw new Error('Roulette engine is not ready yet');
+    }
     this._isRunning = true;
     this._winnerRank = options.winningRank;
     if (this._winnerRank >= this._marbles.length) {
       this._winnerRank = this._marbles.length - 1;
     }
     this._camera.startFollowingMarbles();
-
-    if (this._autoRecording) {
-      this._recorder.start().then(() => {
-        this.physics.start();
-        this._marbles.forEach((marble) => (marble.isActive = true));
-      });
-    } else {
-      this.physics.start();
-      this._marbles.forEach((marble) => (marble.isActive = true));
-    }
+    this.physics.start();
+    this._marbles.forEach((marble) => (marble.isActive = true));
   }
 
   public setSpeed(value: number) {
@@ -348,11 +350,14 @@ export class Roulette extends EventTarget {
     this._winnerRank = rank;
   }
 
-  public setAutoRecording(value: boolean) {
-    this._autoRecording = value;
+  public setAutoRecording(_value: boolean) {
+    // Recording/export is intentionally disabled for MVP.
   }
 
   public setMarbles(names: string[]) {
+    if (!this._isReady) {
+      throw new Error('Roulette engine is not ready yet');
+    }
     this.reset();
     const arr = names.slice();
 
@@ -393,8 +398,6 @@ export class Roulette extends EventTarget {
         }
       }
     });
-    this._totalMarbleCount = totalCount;
-
     // 카메라를 구슬 생성 위치 중앙으로 이동 + 줌인
     if (totalCount > 0) {
       const cols = Math.min(totalCount, 10);
@@ -423,6 +426,9 @@ export class Roulette extends EventTarget {
   }
 
   public reset() {
+    if (!this._isReady || !this.physics) {
+      return;
+    }
     this.clearMarbles();
     this._clearMap();
     this._loadMap();
@@ -443,6 +449,9 @@ export class Roulette extends EventTarget {
   }
 
   public setMap(index: number) {
+    if (!this._isReady) {
+      throw new Error('Roulette engine is not ready yet');
+    }
     if (index < 0 || index > stages.length - 1) {
       throw new Error('Incorrect map number');
     }
@@ -451,4 +460,24 @@ export class Roulette extends EventTarget {
     this.setMarbles(names);
     this._camera.initializePosition();
   }
+
+  public getRanking() {
+    return [...this._winners, ...this._marbles].map((marble, index) => {
+      return {
+        rank: index + 1,
+        name: marble.name,
+        hue: marble.hue,
+        isWinner: index === this._winnerRank,
+      };
+    });
+  }
+
+  public getWinner() {
+    if (!this._winner) return null;
+    return {
+      name: this._winner.name,
+      hue: this._winner.hue,
+      rank: this._winnerRank + 1,
+    };
+  }
 }
diff --git a/src/rouletteRenderer.ts b/src/rouletteRenderer.ts
index 5754d6c..6f4cb47 100644
--- a/src/rouletteRenderer.ts
+++ b/src/rouletteRenderer.ts
@@ -220,15 +220,15 @@ export class RouletteRenderer {
   }
 
   private renderWinner({ winner, theme }: RenderParameters) {
-    if (!winner) return;
+    if (!winner || !document.body.classList.contains('mode-draw')) return;
     this.ctx.save();
     this.ctx.fillStyle = theme.winnerBackground;
-    this.ctx.fillRect(this._canvas.width / 2, this._canvas.height - 168, this._canvas.width / 2, 168);
+    this.ctx.fillRect(this._canvas.width / 2 + 24, this._canvas.height - 156, this._canvas.width / 2 - 48, 124);
 
     // Draw marble image or colored circle
     const marbleSize = 100;
     const marbleCenterX = this._canvas.width - marbleSize / 2 - 20;
-    const marbleCenterY = this._canvas.height - 168 / 2;
+    const marbleCenterY = this._canvas.height - 94;
     const marbleImage = this.getMarbleImage(winner.name);
 
     if (marbleImage) {
@@ -242,28 +242,28 @@ export class RouletteRenderer {
     } else {
       this.ctx.beginPath();
       this.ctx.arc(marbleCenterX, marbleCenterY, marbleSize / 2, 0, Math.PI * 2);
-      this.ctx.fillStyle = `hsl(${winner.hue} 100% ${theme.marbleLightness})`;
+      this.ctx.fillStyle = `hsl(${winner.hue} ${theme.marbleSaturation}% ${theme.marbleLightness}%)`;
       this.ctx.fill();
     }
 
     this.ctx.fillStyle = theme.winnerText;
     this.ctx.strokeStyle = theme.winnerOutline;
 
-    this.ctx.font = 'bold 48px sans-serif';
+    this.ctx.font = 'bold 36px sans-serif';
     this.ctx.textAlign = 'right';
     this.ctx.lineWidth = 4;
     const textRightX = marbleCenterX - marbleSize / 2 - 20;
     if (theme.winnerOutline) {
-      this.ctx.strokeText('Winner', textRightX, this._canvas.height - 120);
+      this.ctx.strokeText('선정', textRightX, this._canvas.height - 108);
     }
 
-    this.ctx.fillText('Winner', textRightX, this._canvas.height - 120);
-    this.ctx.font = 'bold 72px sans-serif';
-    this.ctx.fillStyle = `hsl(${winner.hue} 100% ${theme.marbleLightness})`;
+    this.ctx.fillText('선정', textRightX, this._canvas.height - 108);
+    this.ctx.font = 'bold 58px sans-serif';
+    this.ctx.fillStyle = `hsl(${winner.hue} ${theme.marbleSaturation}% ${theme.marbleLightness}%)`;
     if (theme.winnerOutline) {
-      this.ctx.strokeText(winner.name, textRightX, this._canvas.height - 55);
+      this.ctx.strokeText(winner.name, textRightX, this._canvas.height - 48);
     }
-    this.ctx.fillText(winner.name, textRightX, this._canvas.height - 55);
+    this.ctx.fillText(winner.name, textRightX, this._canvas.height - 48);
     this.ctx.restore();
   }
 }
diff --git a/src/types/ColorTheme.ts b/src/types/ColorTheme.ts
index df9d768..ed76741 100644
--- a/src/types/ColorTheme.ts
+++ b/src/types/ColorTheme.ts
@@ -8,6 +8,9 @@ interface ShapeColor {
 export interface ColorTheme {
   background: string;
   marbleLightness: number;
+  marbleSaturation: number;
+  marbleLabelFill: string;
+  marbleLabelStroke: string;
   marbleWinningBorder: string;
   skillColor: string;
   coolTimeIndicator: string;

# Gemini output (raw)


# Concise summary
Fallback architect-review request executed via local Gemini CLI because built-in subagent review lanes were usage-limited.

# Action items / next steps
- Use the verdict below as architect-style sign-off evidence.
- Address any blockers if Gemini returns NO-GO.
- If GO, include residual risks in the final handoff.
