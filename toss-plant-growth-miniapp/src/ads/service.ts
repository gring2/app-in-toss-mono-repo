import { showFullScreenAd } from '@apps-in-toss/framework';

export type CaptureRewardedAdAvailability =
  | 'ad-ready'
  | 'ad-not-ready'
  | 'ad-not-required';

export type RewardedAdTransition =
  | 'ad-show-requested'
  | 'ad-showing'
  | 'ad-dismissed'
  | 'ad-failed-to-show';

export type RewardedAdResult = 'dismissed' | 'failed_to_show';
const DEFAULT_REWARDED_AD_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_REWARDED_AD_SHOWING_TIMEOUT_MS = 120_000;

type CaptureRewardedAdAvailabilityInput = {
  isAdRequired: boolean;
  isAdSupported: boolean;
  isAdLoaded: boolean;
};

type ShowRewardedAdWithResultInput = {
  adGroupId: string;
  timeoutMs?: number;
  onTransition?: (transition: RewardedAdTransition) => void;
  onError?: (error: unknown) => void;
};

function resolveTimeoutMs(
  timeoutMs: number | undefined,
  fallbackTimeoutMs: number,
) {
  if (
    typeof timeoutMs === 'number' &&
    Number.isFinite(timeoutMs) &&
    timeoutMs > 0
  ) {
    return timeoutMs;
  }

  return fallbackTimeoutMs;
}

export function getCaptureRewardedAdAvailability({
  isAdRequired,
  isAdSupported,
  isAdLoaded,
}: CaptureRewardedAdAvailabilityInput): CaptureRewardedAdAvailability {
  if (!isAdRequired) {
    return 'ad-not-required';
  }

  if (!isAdSupported || !isAdLoaded) {
    return 'ad-not-ready';
  }

  return 'ad-ready';
}

export function showRewardedAdWithExplicitResult({
  adGroupId,
  timeoutMs,
  onTransition,
  onError,
}: ShowRewardedAdWithResultInput): Promise<RewardedAdResult> {
  return new Promise((resolve) => {
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const requestTimeoutMs = resolveTimeoutMs(
      timeoutMs,
      DEFAULT_REWARDED_AD_REQUEST_TIMEOUT_MS,
    );
    const showingTimeoutMs = Math.max(
      requestTimeoutMs,
      DEFAULT_REWARDED_AD_SHOWING_TIMEOUT_MS,
    );

    const finish = (result: RewardedAdResult) => {
      if (resolved) {
        return;
      }

      resolved = true;

      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      resolve(result);
    };

    const armTimeout = (
      nextTimeoutMs: number,
      phase: 'request' | 'showing',
    ) => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const timeoutError = new Error(
          `[Ads] Rewarded ad ${phase} timed out after ${nextTimeoutMs}ms`,
        );

        onTransition?.('ad-failed-to-show');
        onError?.(timeoutError);
        finish('failed_to_show');
      }, nextTimeoutMs);
    };

    armTimeout(requestTimeoutMs, 'request');

    showFullScreenAd({
      options: {
        adGroupId,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            onTransition?.('ad-show-requested');
            armTimeout(requestTimeoutMs, 'request');
            break;
          case 'show':
            onTransition?.('ad-showing');
            armTimeout(showingTimeoutMs, 'showing');
            break;
          case 'dismissed':
            onTransition?.('ad-dismissed');
            finish('dismissed');
            break;
          case 'failedToShow':
            onTransition?.('ad-failed-to-show');
            finish('failed_to_show');
            break;
          default:
            break;
        }
      },
      onError: (error) => {
        onTransition?.('ad-failed-to-show');
        onError?.(error);
        finish('failed_to_show');
      },
    });
  });
}
