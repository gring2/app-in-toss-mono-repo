export type MiniappEventName =
  | 'capture_post_step_entered'
  | 'capture_ad_ready_state'
  | 'capture_ad_watch_clicked'
  | 'capture_ad_show_requested'
  | 'capture_ad_show_success'
  | 'capture_ad_show_failed'
  | 'capture_ad_skip_clicked'
  | 'capture_ad_to_compare_navigated';

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
