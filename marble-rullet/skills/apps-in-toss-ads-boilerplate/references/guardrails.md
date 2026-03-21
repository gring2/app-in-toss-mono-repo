# Guardrails

Non-negotiable behavior:
- no silent success fallback when ad show fails
- no hidden hard-blocking of the core user journey
- no ad placement without visible loading/error recovery state
- no production rollout with missing live adGroupId values
- no duplicate support-gating logic scattered across screens

Recommended defaults:
- centralize runtime/env resolution in config
- use explicit transition/result types for rewarded/interstitial flows
- add timeout-safe failure handling for full-screen ads
- add pacing only for reward-bearing or repetition-sensitive flows
- emit telemetry on ready, requested, show, dismiss, fail, and click/impression when available
