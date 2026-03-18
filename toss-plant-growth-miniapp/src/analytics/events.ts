export type MiniappEventName =
  | 'capture_camera_open_requested'
  | 'capture_camera_open_success'
  | 'capture_camera_open_failed'
  | 'capture_filter_preview_ready'
  | 'capture_filter_preview_fallback'
  | 'capture_save_started'
  | 'capture_save_completed'
  | 'capture_save_failed'
  | 'capture_post_step_entered'
  | 'capture_ad_ready_state'
  | 'capture_ad_watch_clicked'
  | 'capture_ad_show_requested'
  | 'capture_ad_show_success'
  | 'capture_ad_show_failed'
  | 'capture_ad_skip_clicked'
  | 'capture_ad_to_compare_navigated'
  | 'capture_quality_scored'
  | 'capture_quality_retake_prompted'
  | 'capture_quality_retake_chosen'
  | 'capture_quality_saved_anyway'
  | 'capture_enhancement_applied';

type MiniappEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type MiniappEventPayload = {
  name: MiniappEventName;
  at: string;
  params: MiniappEventParams;
};

export function emitMiniappEvent(
  name: MiniappEventName,
  params: MiniappEventParams = {},
) {
  const payload: MiniappEventPayload = {
    name,
    at: new Date().toISOString(),
    params,
  };

  console.info('[MiniappEvent]', JSON.stringify(payload));
}
