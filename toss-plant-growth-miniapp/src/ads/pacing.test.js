const mockStorageMap = new Map();

jest.mock('@apps-in-toss/native-modules', () => ({
  Storage: {
    getItem: jest.fn(async (key) =>
      mockStorageMap.has(key) ? mockStorageMap.get(key) : null,
    ),
    setItem: jest.fn(async (key, value) => {
      mockStorageMap.set(key, value);
    }),
  },
}));

function loadPacingModule() {
  return require('./pacing');
}

describe('ads/pacing', () => {
  beforeEach(() => {
    jest.resetModules();
    mockStorageMap.clear();
  });

  it('tracks ad exposure per slot independently on the same day', async () => {
    const { markRewardedAdShownForSlot, shouldShowRewardedAdForSlot } =
      loadPacingModule();

    expect(await shouldShowRewardedAdForSlot('slot-1', '2026-2-4')).toBe(true);
    expect(await shouldShowRewardedAdForSlot('slot-2', '2026-2-4')).toBe(true);

    await markRewardedAdShownForSlot('slot-1', '2026-2-4');

    expect(await shouldShowRewardedAdForSlot('slot-1', '2026-2-4')).toBe(false);
    expect(await shouldShowRewardedAdForSlot('slot-2', '2026-2-4')).toBe(true);
  });

  it('resets exposure availability on the next day', async () => {
    const { markRewardedAdShownForSlot, shouldShowRewardedAdForSlot } =
      loadPacingModule();

    await markRewardedAdShownForSlot('slot-1', '2026-2-4');

    expect(await shouldShowRewardedAdForSlot('slot-1', '2026-2-4')).toBe(false);
    expect(await shouldShowRewardedAdForSlot('slot-1', '2026-2-5')).toBe(true);
  });

  it('does not block slot-based pacing when legacy global pacing data exists', async () => {
    mockStorageMap.set(
      'plant-growth-ad-pacing-v2',
      JSON.stringify({
        lastInterstitialShownDateKey: '2026-2-4',
      }),
    );

    const { shouldShowRewardedAdForSlot } = loadPacingModule();

    expect(await shouldShowRewardedAdForSlot('slot-1', '2026-2-4')).toBe(true);
  });
});
