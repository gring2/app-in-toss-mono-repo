import { TossAds } from '@apps-in-toss/web-framework';
import { adGroupIds } from '../../../config/ads';

export function mount__AD_GROUP_KEY_CONST__Banner(target: HTMLElement) {
  return TossAds.attachBanner(adGroupIds.__AD_GROUP_KEY__.test, target, {
    theme: 'auto',
    tone: 'grey',
    variant: 'card',
  });
}
