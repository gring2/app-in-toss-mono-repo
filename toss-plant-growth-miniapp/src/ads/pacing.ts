import { Storage } from '@apps-in-toss/native-modules';

type AdPacingState = {
  rewardedShownDateKeyBySlot: Record<string, string>;
};

type LegacyAdPacingState = {
  lastInterstitialShownDateKey: string | null;
};

const AD_PACING_STORAGE_KEY = 'plant-growth-ad-pacing-v3';
const LEGACY_AD_PACING_STORAGE_KEY = 'plant-growth-ad-pacing-v2';
const DEFAULT_PACING_STATE: AdPacingState = {
  rewardedShownDateKeyBySlot: {},
};

let cache: AdPacingState | null = null;

function isAdPacingState(value: unknown): value is AdPacingState {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    !isObject(candidate.rewardedShownDateKeyBySlot) ||
    !Object.values(candidate.rewardedShownDateKeyBySlot).every(
      (entry) => typeof entry === 'string',
    )
  ) {
    return false;
  }

  return true;
}

function isLegacyAdPacingState(value: unknown): value is LegacyAdPacingState {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.lastInterstitialShownDateKey == null ||
    typeof candidate.lastInterstitialShownDateKey === 'string'
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function cloneState(state: AdPacingState): AdPacingState {
  return {
    rewardedShownDateKeyBySlot: { ...state.rewardedShownDateKeyBySlot },
  };
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function normalizeSlotKey(slotKey: string) {
  return slotKey.trim();
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
      const legacyRaw = await Storage.getItem(LEGACY_AD_PACING_STORAGE_KEY);

      if (legacyRaw != null) {
        const legacyParsed = JSON.parse(legacyRaw);

        if (isLegacyAdPacingState(legacyParsed)) {
          cache = cloneState(DEFAULT_PACING_STATE);
          return cloneState(DEFAULT_PACING_STATE);
        }
      }

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

export async function shouldShowRewardedAdForSlot(
  slotKey: string,
  dateKey = toDateKey(new Date()),
) {
  const normalizedSlotKey = normalizeSlotKey(slotKey);

  if (normalizedSlotKey.length === 0 || dateKey.length === 0) {
    return false;
  }

  try {
    const state = await readState();

    return state.rewardedShownDateKeyBySlot[normalizedSlotKey] !== dateKey;
  } catch (error) {
    console.warn('[Ads] Failed to evaluate ad pacing state:', error);
    return false;
  }
}

export async function markRewardedAdShownForSlot(
  slotKey: string,
  dateKey = toDateKey(new Date()),
) {
  const normalizedSlotKey = normalizeSlotKey(slotKey);

  if (normalizedSlotKey.length === 0 || dateKey.length === 0) {
    return;
  }

  try {
    const current = await readState();
    const nextState: AdPacingState = {
      rewardedShownDateKeyBySlot: {
        ...current.rewardedShownDateKeyBySlot,
        [normalizedSlotKey]: dateKey,
      },
    };

    await persistState(nextState);
  } catch (error) {
    console.warn('[Ads] Failed to mark rewarded ad as shown:', error);
  }
}
