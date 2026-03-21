export function track__AD_GROUP_KEY_CONST__(name: string, params: Record<string, unknown> = {}) {
  window.dispatchEvent(
    new CustomEvent('__FLOW_KEY__:ad-event', {
      detail: { name, params, timestamp: Date.now() },
    })
  );
}
