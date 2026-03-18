# Retention UX Handoff

Retention UX handoff for marble mono redesign
Context: setup -> draw -> result flow; optimize repeat-use, not one-off completion.
Decision: prioritize preserved participant lists, recent presets, distraction-free draw, and one-tap rerun from result. Expected impact: same-session rerun +15-25%, setup->draw >=85%, D1 repeat +5% without >2% retention regression.
Output:
1) Journey: Compose restores last list/presets and shows readiness; Draw has no interruptions except cancel confirm; Result makes Rerun primary, Edit secondary, Copy tertiary.
2) KPI targets/guardrails: setup_to_draw >=85%; rerun_rate >=30%; preset_reuse >=20%; result_copy >=10%; draw_abort <=3%; error_toast_sessions <=2%; D1 repeat_visit no worse than -2% vs baseline.
3) Event spec: setup_view; participants_loaded(count, source); winner_mode_changed(mode); custom_rank_set(rank); draw_started(count, mode, map); draw_cancelled(reason); draw_completed(count, selected_rank); rerun_tapped; edit_names_tapped; result_copied; presets_cleared; error_toast_shown(type).
4) Edge states: empty participants with example copy; custom rank clamp with inline message; no presets empty state; copy failure toast; interrupted-draw confirm; ranking unavailable fallback; localStorage read failure falls back to in-memory session.
Risks: if UI adds friction before first draw or hides rerun, repeat-use will regress.
Next owner: worker-1 to fold into Compose/Draw/Result spec; worker-3 to align monetization guardrails.
