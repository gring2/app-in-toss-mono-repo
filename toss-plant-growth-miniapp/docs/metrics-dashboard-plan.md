# Metrics & Dashboard Query Plan

## Scope
- App: `plant-growth-miniapp`
- Focus: retention-safe ad flow in capture -> compare journey
- Event source: `src/pages/capture.tsx`, `src/analytics/events.ts`

## KPI Guardrails
- Retention:
  - D1 retention (non-regression vs baseline)
  - D7 retention (non-regression vs baseline)
  - Repeat visit rate
- Monetization:
  - Ad watch intent rate (`capture_ad_watch_clicked / capture_post_step_entered`)
  - Ad show success rate (`capture_ad_show_success / capture_ad_show_requested`)
  - Ad fail rate (`capture_ad_show_failed / capture_ad_show_requested`)
  - Skip rate (`capture_ad_skip_clicked / capture_post_step_entered`)

## Event Dictionary (Capture Ad Flow)
- `capture_post_step_entered`
- `capture_ad_ready_state`
- `capture_ad_watch_clicked`
- `capture_ad_show_requested`
- `capture_ad_show_success`
- `capture_ad_show_failed`
- `capture_ad_skip_clicked`
- `capture_ad_to_compare_navigated`

Common params:
- `screen`
- `mode`

Important per-event params:
- `ad_ready_state`
- `reason`
- `slot_key`
- `date_key`

## Query Drafts (Warehouse-style pseudocode)

### 1) Daily ad show success/fail funnel
```sql
SELECT
  event_date,
  COUNT_IF(event_name = 'capture_ad_show_requested') AS show_requested,
  COUNT_IF(event_name = 'capture_ad_show_success') AS show_success,
  COUNT_IF(event_name = 'capture_ad_show_failed') AS show_failed,
  SAFE_DIVIDE(COUNT_IF(event_name = 'capture_ad_show_success'),
              COUNT_IF(event_name = 'capture_ad_show_requested')) AS show_success_rate
FROM miniapp_events
WHERE app_name = 'plant-growth-miniapp'
GROUP BY event_date
ORDER BY event_date DESC;
```

### 2) Ready-state and watch-click conversion
```sql
SELECT
  JSON_VALUE(params, '$.ad_ready_state') AS ad_ready_state,
  COUNT_IF(event_name = 'capture_post_step_entered') AS post_step_entered,
  COUNT_IF(event_name = 'capture_ad_watch_clicked') AS watch_clicked
FROM miniapp_events
WHERE app_name = 'plant-growth-miniapp'
GROUP BY ad_ready_state;
```

### 3) Compare navigation reason distribution
```sql
SELECT
  JSON_VALUE(params, '$.reason') AS reason,
  COUNT(*) AS navigations
FROM miniapp_events
WHERE app_name = 'plant-growth-miniapp'
  AND event_name = 'capture_ad_to_compare_navigated'
GROUP BY reason
ORDER BY navigations DESC;
```

## Operational Rollback Signals
- Trigger rollback investigation if either persists for 24h:
  - `show_success_rate < 0.8`
  - `show_failed / show_requested > 0.2`
- Block rollout when crash/blocker reports align with high `capture_ad_show_failed` spikes.

## Submission Attachment Checklist
- Include this file in submission evidence package.
- Attach latest release evidence report:
  - `.omx/reports/release-evidence-<timestamp>/report.md`
