const mockShowFullScreenAd = jest.fn();

jest.mock('@apps-in-toss/framework', () => ({
  showFullScreenAd: (...args) => mockShowFullScreenAd(...args),
}));

function loadServiceModule() {
  return require('./service');
}

describe('ads/service', () => {
  beforeEach(() => {
    jest.resetModules();
    mockShowFullScreenAd.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns dismissed when ad flow reaches dismissed event', async () => {
    mockShowFullScreenAd.mockImplementation(({ onEvent }) => {
      onEvent({ type: 'requested' });
      onEvent({ type: 'show' });
      onEvent({ type: 'dismissed' });
    });

    const { showRewardedAdWithExplicitResult } = loadServiceModule();
    const transitions = [];
    const result = await showRewardedAdWithExplicitResult({
      adGroupId: 'test-ad-group',
      onTransition: (transition) => transitions.push(transition),
    });

    expect(result).toBe('dismissed');
    expect(transitions).toEqual([
      'ad-show-requested',
      'ad-showing',
      'ad-dismissed',
    ]);
  });

  it('returns failed_to_show when ad flow emits failedToShow', async () => {
    mockShowFullScreenAd.mockImplementation(({ onEvent }) => {
      onEvent({ type: 'requested' });
      onEvent({ type: 'failedToShow' });
    });

    const { showRewardedAdWithExplicitResult } = loadServiceModule();
    const transitions = [];
    const result = await showRewardedAdWithExplicitResult({
      adGroupId: 'test-ad-group',
      onTransition: (transition) => transitions.push(transition),
    });

    expect(result).toBe('failed_to_show');
    expect(transitions).toEqual(['ad-show-requested', 'ad-failed-to-show']);
  });

  it('handles ad onError callback as failed_to_show', async () => {
    const adError = new Error('ad failed');

    mockShowFullScreenAd.mockImplementation(({ onError }) => {
      onError(adError);
    });

    const { showRewardedAdWithExplicitResult } = loadServiceModule();
    const transitions = [];
    const onError = jest.fn();
    const result = await showRewardedAdWithExplicitResult({
      adGroupId: 'test-ad-group',
      onTransition: (transition) => transitions.push(transition),
      onError,
    });

    expect(result).toBe('failed_to_show');
    expect(transitions).toEqual(['ad-failed-to-show']);
    expect(onError).toHaveBeenCalledWith(adError);
  });

  it('fails safely when ad SDK does not emit terminal events before timeout', async () => {
    jest.useFakeTimers();
    mockShowFullScreenAd.mockImplementation(() => {});

    const { showRewardedAdWithExplicitResult } = loadServiceModule();
    const transitions = [];
    const onError = jest.fn();
    const resultPromise = showRewardedAdWithExplicitResult({
      adGroupId: 'test-ad-group',
      timeoutMs: 50,
      onTransition: (transition) => transitions.push(transition),
      onError,
    });

    jest.advanceTimersByTime(50);

    const result = await resultPromise;

    expect(result).toBe('failed_to_show');
    expect(transitions).toEqual(['ad-failed-to-show']);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('keeps ad session alive after show event and resolves dismissed later', async () => {
    jest.useFakeTimers();
    mockShowFullScreenAd.mockImplementation(({ onEvent }) => {
      onEvent({ type: 'requested' });
      onEvent({ type: 'show' });
      setTimeout(() => {
        onEvent({ type: 'dismissed' });
      }, 20);
    });

    const { showRewardedAdWithExplicitResult } = loadServiceModule();
    const transitions = [];
    const onError = jest.fn();
    const resultPromise = showRewardedAdWithExplicitResult({
      adGroupId: 'test-ad-group',
      timeoutMs: 10,
      onTransition: (transition) => transitions.push(transition),
      onError,
    });

    jest.advanceTimersByTime(20);

    const result = await resultPromise;

    expect(result).toBe('dismissed');
    expect(transitions).toEqual([
      'ad-show-requested',
      'ad-showing',
      'ad-dismissed',
    ]);
    expect(onError).not.toHaveBeenCalled();
  });

  it('maps ad availability state explicitly', () => {
    const { getCaptureRewardedAdAvailability } = loadServiceModule();

    expect(
      getCaptureRewardedAdAvailability({
        isAdRequired: false,
        isAdSupported: false,
        isAdLoaded: false,
      }),
    ).toBe('ad-not-required');

    expect(
      getCaptureRewardedAdAvailability({
        isAdRequired: true,
        isAdSupported: false,
        isAdLoaded: true,
      }),
    ).toBe('ad-not-ready');

    expect(
      getCaptureRewardedAdAvailability({
        isAdRequired: true,
        isAdSupported: true,
        isAdLoaded: true,
      }),
    ).toBe('ad-ready');
  });
});
