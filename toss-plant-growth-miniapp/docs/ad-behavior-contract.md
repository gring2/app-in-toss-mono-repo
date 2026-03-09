# Ad Behavior Contract — Capture to Report Flow

## Purpose
Make rewarded full-screen ad behavior explicit and testable to avoid ambiguous user outcomes.

## In-Scope Flow
- Screen: `src/pages/capture.tsx`
- CTA path: capture success -> post-capture actions -> compare report

## State Table

| State | UI Behavior | User Message | Navigation |
|---|---|---|---|
| ad-ready | Show `광고 보고 리포트 보기` + `리포트 바로 보기` | `광고를 보면 리포트로 바로 이어서 볼 수 있어요.` | Depends on user action |
| ad-not-ready | Do not force ad path; allow direct report | `광고를 준비 중이에요. 잠시 후 다시 시도해주세요.` | Stay on capture post-step until user chooses |
| ad-show-requested | Lock duplicate ad action | `기록 저장 완료! 광고를 여는 중이에요.` | No immediate navigation |
| ad-showing | Continue processing state | `광고 시청 후 리포트 화면으로 이동해요.` | No immediate navigation |
| ad-dismissed | Ad flow complete | (no extra error) | Navigate to `/compare` |
| ad-failed-to-show | Show failure and recoverable action | `광고를 표시하지 못했어요. 다시 시도하거나 리포트 바로 보기를 선택해주세요.` | Stay on screen |
| ad-timeout (mapped to `ad-failed-to-show`) | If SDK does not emit expected progress/terminal events in time, fail safely | `광고를 표시하지 못했어요. 다시 시도하거나 리포트 바로 보기를 선택해주세요.` | Stay on screen |
| user-skip | Skip ad explicitly | (no error) | Navigate to `/compare` |

## Non-Negotiable Rules
1. No silent fallback from “watch ad” tap to compare when ad fails.
2. Failure states must be user-visible and recoverable.
3. Navigation to compare after ad path occurs only on expected terminal event (`dismissed`) or explicit user skip.
4. Ad pacing checks must run before presenting ad-candidate path.
5. Ad show flow must fail safely via timeout fallback:
   - short timeout before/around ad show request,
   - extended timeout once ad is actually showing.

## Event Spec (Minimum)
- `capture_post_step_entered`
- `capture_ad_ready_state` (ready/not_ready)
- `capture_ad_watch_clicked`
- `capture_ad_show_requested`
- `capture_ad_show_success`
- `capture_ad_show_failed`
- `capture_ad_skip_clicked`
- `capture_ad_to_compare_navigated`

### Event Params (Current)
- Common: `screen`, `mode`
- `capture_post_step_entered`: `slot_key`, `date_key`
- `capture_ad_ready_state`: `ad_ready_state`
- `capture_ad_watch_clicked`: `ad_ready_state`
- `capture_ad_show_failed`: `reason`
- `capture_ad_to_compare_navigated`: `reason`

### Emission Source
- `src/pages/capture.tsx` (capture/ad transitions)
- `src/analytics/events.ts` (structured event payload logger)

## Verification Matrix
Run for every release candidate:
1. Ad ready -> watch -> ad shown -> dismissed -> compare 이동
2. Ad not ready -> watch -> error shown (no forced navigation)
3. Ad failedToShow -> error shown, retry 가능
4. Ad show 이후 delayed dismissed(정상 재생) -> 비교 화면 정상 이동
5. Ad timeout -> same fallback as failedToShow (no silent navigation)
6. Skip CTA -> immediate compare 이동
7. Pacing blocked -> post-step bypass behavior matches spec

## Current Implementation References
- Ad runtime/config: `src/config/ads.ts`
- Ad flow handler: `src/pages/capture.tsx`
- Pacing checks: `src/ads/pacing.ts`
