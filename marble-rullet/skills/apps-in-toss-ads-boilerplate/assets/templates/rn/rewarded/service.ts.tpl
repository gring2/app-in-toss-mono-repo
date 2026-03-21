import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';
import { adGroupIds } from '../../../config/ads';

export type __AD_GROUP_KEY_CONST__Availability = 'ad-ready' | 'ad-not-ready' | 'ad-not-required';
export type __AD_GROUP_KEY_CONST__Result = 'dismissed' | 'failed_to_show';

export function preload__AD_GROUP_KEY_CONST__Rewarded(onLoaded: () => void, onError: (error: unknown) => void) {
  return loadFullScreenAd({
    options: { adGroupId: adGroupIds.__AD_GROUP_KEY__.test },
    onEvent: (event) => {
      if (event.type === 'loaded') {
        onLoaded();
      }
    },
    onError,
  });
}

export function show__AD_GROUP_KEY_CONST__Rewarded(onEvent: (event: unknown) => void, onError: (error: unknown) => void) {
  return showFullScreenAd({
    options: { adGroupId: adGroupIds.__AD_GROUP_KEY__.test },
    onEvent,
    onError,
  });
}
