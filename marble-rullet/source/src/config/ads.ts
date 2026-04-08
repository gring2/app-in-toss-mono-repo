export type AdEnvironment = 'test' | 'live';

export const adRuntime = {
  runtime: 'webview',
} as const;

export const adGroupIds = {
  banner: {
    test: 'ait-ad-test-banner-id',
    live: 'ait.v2.live.56ff85aea080461d',
  },
} as const;

export const bannerAdRuntime = {
  metaTagName: 'ait-ad-env',
  minTossAppVersion: '5.241.0',
  requiredConstantHandlers: ['fetchTossAd_isSupported', 'getOperationalEnvironment', 'getTossAppVersion'],
} as const;

export const submissionAdConfig = {
  bannerConfigured: adGroupIds.banner.live.trim().length > 0,
} as const;

export type BannerAdGroupConfig = {
  adEnv: AdEnvironment;
  adGroupId: string;
  source: 'default' | 'env';
};

const PLACEHOLDER_TOKEN_PATTERN = /^__.+__$/;

function normalizeConfiguredAdEnv(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || PLACEHOLDER_TOKEN_PATTERN.test(normalized)) {
    return undefined;
  }

  if (normalized === 'live') {
    return 'live' as const;
  }

  if (normalized === 'test') {
    return 'test' as const;
  }

  return undefined;
}

export function resolveBannerAdGroupConfig(): BannerAdGroupConfig {
  const metaAdEnv = document
    .querySelector<HTMLMetaElement>(`meta[name="${bannerAdRuntime.metaTagName}"]`)
    ?.content?.trim();
  const envAdEnv = typeof process !== 'undefined' ? process?.env?.AIT_AD_ENV : undefined;
  const configuredAdEnv = normalizeConfiguredAdEnv(metaAdEnv) ?? normalizeConfiguredAdEnv(envAdEnv);

  if (configuredAdEnv === 'test') {
    return {
      adEnv: 'test',
      adGroupId: adGroupIds.banner.test,
      source: 'env',
    };
  }

  if (configuredAdEnv === 'live') {
    return {
      adEnv: 'live',
      adGroupId: adGroupIds.banner.live,
      source: 'env',
    };
  }

  return {
    adEnv: 'live',
    adGroupId: adGroupIds.banner.live,
    source: 'default',
  };
}
