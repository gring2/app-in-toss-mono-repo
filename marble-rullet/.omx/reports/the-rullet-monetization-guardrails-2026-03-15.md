# Monetization Guardrails Handoff

Monetization Specialist handoff for marble mono redesign
Context: current miniapp is a WebView utility with Setup -> Draw -> Result flow, local-only presets, and a retention goal centered on fast reruns. Toss docs confirm (1) WebView banner ads use TossAds.initialize + TossAds.attachBanner and require 100% width / fixed 96px if fixed, supported from Toss app 5.241.0+, (2) full-screen integrated ads use loadFullScreenAd/showFullScreenAd, must preload one-at-a-time, supported from 5.244.1+ for ver2, and reward must be granted only on userEarnedReward, (3) IAP is available from 5.219.0+.
Decision: ship control with NO ads in v1 baseline. Expected impact: protects setup_to_draw >=85%, rerun_rate >=30%, and D1 repeat within 0 to +5% because no monetization interrupts fairness-critical moments.
Decision: if monetization is required after baseline, allow ONLY retention-safe result-screen monetization. Expected impact: ARPDAU lift with retention change capped within -2% vs control because ads appear after value is delivered, never before/during draw.
Decision: do NOT use auto-shown interstitials in setup, draw, or immediately on result reveal. Expected impact: avoids draw_abort increase (>1pp risk) and preserves trust that the draw is fair.
Output:
1) Placement plan
- Setup/Compose screen: no banners, no interstitials, no paywall. Keep participant entry / presets distraction-free.
- Draw screen: no monetization at all. No banner overlays, no interstitial before winner reveal, no reward prompt mid-animation.
- Result screen (first monetization test only): WebView banner slot allowed only BELOW the full result action block so Rerun/Edit/Copy remain above the fold. Use TossAds.attachBanner in a 100%-width container; collapse the slot entirely on onNoFill/onAdFailedToRender so no blank 96px hole remains.
- Optional future monetization, only if baseline retention is healthy: explicit opt-in rewarded ad from a secondary “extras” affordance on Result (example reward: celebratory theme/share card variant), never tied to winner outcome, rerun, edit, copy, or preset restore.
- Alternative/fallback monetization path: one-time IAP “Pro utility pack” (saved preset bundles, premium share card/theme, ad-free pledge) is safer than forced full-screen ads for this utility use case.
2) Pacing / frequency plan
- Default cohort: first 2 lifetime completed draws = hard no-ad zone.
- Returning-user banner test eligibility: lifetime_completed_draws >=2 OR same-session rerun_count >=1.
- Banner cap: max 1 impression per session, max 1 impression per 3 completed draws, suppress after ad click for 7 days.
- Rewarded cap: user-initiated only, max 1 completed reward per day, max 2 prompts per 7 days, never auto-open.
- Cooldowns: if draw_cancelled, copy_failed, localStorage_error, or ranking_fallback occurs, suppress monetization for the rest of the session.
3) Experiment matrix
- Control: no ads / no purchase prompt.
- Variant A: result-only banner for eligible returning users.
- Variant B: control + opt-in rewarded “extras” button on result; no banner.
- Variant C (later only): lightweight IAP card on settings/result secondary area, no ads.
- Success metrics: ARPDAU / impression yield up, while setup_to_draw stays >=85%, rerun_rate stays >=30%, draw_abort <=3%, D1 repeat no worse than -2% vs control.
4) Monetization event spec
- monetization_eligible(screen, session_draws, lifetime_draws, returning_user)
- banner_init(ad_group_id, screen)
- banner_rendered(slot_id)
- banner_impression(slot_id)
- banner_clicked(slot_id)
- banner_no_fill(slot_id)
- banner_render_failed(code)
- reward_prompt_viewed(source)
- reward_load_started(ad_group_id)
- reward_loaded(ad_group_id)
- reward_show_requested(ad_group_id)
- reward_impression(ad_group_id)
- reward_earned(unit_type, unit_amount)
- reward_dismissed(ad_group_id)
- iap_entry_viewed(surface)
- iap_purchase_started(sku)
- iap_purchase_succeeded(sku)
- iap_purchase_failed(sku, reason)
5) Rollback criteria
- Immediate rollback to control if rerun_rate drops >5% relative, setup_to_draw drops >3% relative, draw_abort rises >1pp, D1 repeat drops >2% vs control, or monetization complaint rate exceeds 0.5% of sessions.
- Immediate rollback if any ad renders before winner reveal / blocks rerun CTA / leaves empty failed-ad space.
Risks: even result-only monetization can reduce delight in a utility app; blank ad containers or frequent repeat exposure will feel broken; rewarded concepts must never imply better draw odds or alter fairness.
Next owner: worker-1 to fold these guardrails into Compose/Draw/Result mono spec; leader to choose control vs Variant A/B for the final package.
