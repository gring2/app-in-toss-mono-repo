const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

function loadEventsModule() {
  return require('./events');
}

describe('analytics/events', () => {
  beforeEach(() => {
    jest.resetModules();
    infoSpy.mockClear();
  });

  afterAll(() => {
    infoSpy.mockRestore();
  });

  it('emits structured miniapp events', () => {
    const { emitMiniappEvent } = loadEventsModule();

    emitMiniappEvent('capture_ad_watch_clicked', {
      screen: 'capture',
      mode: 'daily',
      ad_ready_state: 'ready',
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0][0]).toBe('[MiniappEvent]');

    const payload = JSON.parse(infoSpy.mock.calls[0][1]);
    expect(payload.name).toBe('capture_ad_watch_clicked');
    expect(payload.params.screen).toBe('capture');
    expect(payload.params.mode).toBe('daily');
    expect(payload.params.ad_ready_state).toBe('ready');
    expect(typeof payload.at).toBe('string');
  });
});
