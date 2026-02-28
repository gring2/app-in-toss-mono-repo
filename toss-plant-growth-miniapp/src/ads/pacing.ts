import { Storage } from '@apps-in-toss/native-modules';

type AdPacingState = {
  lastInterstitialShownDateKey: string | null;
};

const AD_PACING_STORAGE_KEY = 'plant-growth-ad-pacing-v2';
const DEFAULT_PACING_STATE: AdPacingState = {
  lastInterstitialShownDateKey: null,
};

let cache: AdPacingState | null = null;

function isAdPacingState(value: unknown): value is AdPacingState {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.lastInterstitialShownDateKey == null ||
    typeof candidate.lastInterstitialShownDateKey === 'string'
  );
}

function cloneState(state: AdPacingState): AdPacingState {
  return {
    lastInterstitialShownDateKey: state.lastInterstitialShownDateKey,
  };
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

async function persistState(nextState: AdPacingState) {
  cache = cloneState(nextState);
  await Storage.setItem(AD_PACING_STORAGE_KEY, JSON.stringify(nextState));
}

async function readState(): Promise<AdPacingState> {
  if (cache != null) {
    return cloneState(cache);
  }

  try {
    const raw = await Storage.getItem(AD_PACING_STORAGE_KEY);

    if (raw == null) {
      cache = cloneState(DEFAULT_PACING_STATE);
      return cloneState(DEFAULT_PACING_STATE);
    }

    const parsed = JSON.parse(raw);

    if (isAdPacingState(parsed)) {
      cache = cloneState(parsed);
      return cloneState(parsed);
    }
  } catch (error) {
    console.warn('[Ads] Failed to read pacing state:', error);
  }

  cache = cloneState(DEFAULT_PACING_STATE);
  return cloneState(DEFAULT_PACING_STATE);
}

export async function registerCaptureAndShouldShowInterstitialAd() {
  try {
    const state = await readState();
    const todayKey = toDateKey(new Date());

    return state.lastInterstitialShownDateKey !== todayKey;
  } catch (error) {
    console.warn('[Ads] Failed to evaluate ad pacing state:', error);
    return false;
  }
}

export async function markInterstitialAdShown() {
  try {
    const nextState: AdPacingState = {
      lastInterstitialShownDateKey: toDateKey(new Date()),
    };

    await persistState(nextState);
  } catch (error) {
    console.warn('[Ads] Failed to mark interstitial shown:', error);
  }
}
