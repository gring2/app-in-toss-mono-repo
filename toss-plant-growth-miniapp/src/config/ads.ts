import { getOperationalEnvironment } from '@apps-in-toss/framework';

export type AdOperationalEnvironment = 'toss' | 'sandbox';

export const nonLiveTestAdGroupIds = {
  interstitial: 'ait-ad-test-interstitial-id',
  rewarded: 'ait-ad-test-rewarded-id',
} as const;

const PRODUCTION_AD_GROUP_IDS = {
  captureReward: 'ait.v2.live.7dad2a74da0c40b6',
} as const;

function normalizeProductionAdGroupId(value: string) {
  return value.trim();
}

function resolveOperationalEnvironment(): AdOperationalEnvironment {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'sandbox';
  }

  try {
    return getOperationalEnvironment();
  } catch {
    return 'sandbox';
  }
}

const environment = resolveOperationalEnvironment();
const isRewardedAdRequired = environment === 'toss';

function resolveAdGroupId(productionValue: string) {
  if (isRewardedAdRequired) {
    return normalizeProductionAdGroupId(productionValue);
  }

  return nonLiveTestAdGroupIds.rewarded;
}

export const adRuntime = {
  environment,
  isRewardedAdRequired,
} as const;

export const adGroupIds = {
  captureReward: resolveAdGroupId(PRODUCTION_AD_GROUP_IDS.captureReward),
} as const;

export const submissionAdConfig = {
  captureRewardConfigured: PRODUCTION_AD_GROUP_IDS.captureReward.length > 0,
} as const;
