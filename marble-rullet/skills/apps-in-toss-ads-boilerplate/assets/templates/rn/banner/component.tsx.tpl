import React from 'react';
import { InlineAd } from '@apps-in-toss/framework';
import { adGroupIds } from '../../../config/ads';

export function __AD_GROUP_KEY_CONST__Banner() {
  return <InlineAd adGroupId={adGroupIds.__AD_GROUP_KEY__.test} variant="card" tone="grey" />;
}
