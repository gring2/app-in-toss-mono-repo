---
name: apps-in-toss-ads-boilerplate
description: Generate or refactor runtime-first Apps-in-Toss ad integrations for WebView or React Native miniapps. Use when adding banner, rewarded, or interstitial ads, extracting fragile inline ad code into app-owned modules, or scaffolding shared ad config, pacing, telemetry, and safe fallback behavior.
---

# Apps-in-Toss Ads Boilerplate

## Overview

Create runtime-first ad scaffolds for Apps-in-Toss miniapps.

This skill is for ad work that repeatedly causes friction: bridge/support gating, test/live adGroupId config, safe fallback behavior, pacing, and load/show lifecycle handling.

## Structure

This skill is organized by **runtime first**, then **runtime-shared config**, then **ad type**:

- `assets/templates/webview/config`
- `assets/templates/webview/banner`
- `assets/templates/webview/rewarded`
- `assets/templates/webview/interstitial`
- `assets/templates/rn/config`
- `assets/templates/rn/banner`
- `assets/templates/rn/rewarded`
- `assets/templates/rn/interstitial`

The generator always composes two template buckets:
1. `runtime/config`
2. `runtime/ad-type`

## When to use

Use this skill when you need to:
- add a new ad surface to an Apps-in-Toss miniapp
- replace ad logic embedded inside a screen/controller with app-owned modules
- scaffold shared ad config before submission work
- standardize rewarded/interstitial timeout and failure handling
- generate a safe starting point instead of re-deriving Toss ad patterns from scratch

## Quick start

Run the generator with the target app path, runtime, and ad type.

```bash
python3 skills/apps-in-toss-ads-boilerplate/scripts/generate_ads_boilerplate.py   --runtime webview   --type banner   --target source   --feature-name "Compose banner"   --flow-key compose_banner   --placement-key compose_screen   --ad-group-key composeBanner
```

```bash
python3 skills/apps-in-toss-ads-boilerplate/scripts/generate_ads_boilerplate.py   --runtime rn   --type rewarded   --target ../toss-plant-growth-miniapp   --feature-name "Capture reward gate"   --flow-key capture_reward   --placement-key capture_post_step   --ad-group-key captureReward
```

## Required inputs

- `--runtime`: `webview` or `rn`
- `--type`: `banner`, `rewarded`, or `interstitial`
- `--target`: target app root
- `--feature-name`: human-readable label for comments/docs
- `--flow-key`: lifecycle or flow identifier
- `--placement-key`: placement identifier for telemetry
- `--ad-group-key`: config key name for this ad surface

Optional:
- `--production-ad-group-id`
- `--test-ad-group-id`
- `--force`
- `--dry-run`

If IDs are omitted, the generator emits obvious TODO placeholders.

## Guardrails

Before generating or applying boilerplate:
- confirm runtime (`@apps-in-toss/web-framework` vs `@apps-in-toss/framework`)
- keep config in app-owned modules, not buried inside screens
- do not silently block the core flow on ad failure
- keep failure states visible and recoverable
- use pacing only when the product flow actually needs it
- prefer test IDs outside live Toss runtime

Load references only as needed:
- `references/runtime-matrix.md`
- `references/guardrails.md`
- `references/placement-checklist.md`
- `references/ads-overview.md`

## Resources

### scripts/
- `generate_ads_boilerplate.py`: deterministic template renderer

### references/
- runtime matrix, guardrails, and placement notes

### assets/
- runtime-first templates grouped by `webview|rn -> config -> ad-type`
