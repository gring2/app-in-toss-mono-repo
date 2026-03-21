export const adRuntime = {
  runtime: 'rn',
  feature: '__FEATURE_NAME__',
  placementKey: '__PLACEMENT_KEY__',
  flowKey: '__FLOW_KEY__',
} as const;

export const adGroupIds = {
  __AD_GROUP_KEY__: {
    test: '__TEST_AD_GROUP_ID__',
    live: '__PRODUCTION_AD_GROUP_ID__',
  },
} as const;

export const submissionAdConfig = {
  __AD_GROUP_KEY__: adGroupIds.__AD_GROUP_KEY__.live.trim().length > 0,
} as const;
