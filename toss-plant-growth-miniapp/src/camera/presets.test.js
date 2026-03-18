const { CAMERA_PRESETS, DEFAULT_CAMERA_PRESET_ID } = require('./presets');

describe('camera/presets', () => {
  it('keeps today diary as the default fast path', () => {
    const preset = CAMERA_PRESETS.find(
      (candidate) => candidate.id === DEFAULT_CAMERA_PRESET_ID,
    );

    expect(preset).toBeDefined();
    expect(preset.processingProfile).toBe('none');
    expect(preset.captureCta).toBe('오늘 기록 모드로 촬영하기');
  });

  it('has exactly one lightweight detail preset', () => {
    const lightPresets = CAMERA_PRESETS.filter(
      (preset) => preset.processingProfile === 'light',
    );

    expect(lightPresets).toHaveLength(1);
    expect(lightPresets[0].id).toBe('detail');
    expect(lightPresets[0].filterLabel).toBe('리프 디테일');
  });

  it('has exactly one recommended default preset with next-step guidance', () => {
    const recommended = CAMERA_PRESETS.filter((preset) => preset.recommended);

    expect(recommended).toHaveLength(1);
    expect(recommended[0].id).toBe(DEFAULT_CAMERA_PRESET_ID);
    expect(recommended[0].flowSummary.length).toBeGreaterThan(0);
    expect(recommended[0].tomorrowCue.length).toBeGreaterThan(0);
  });

  it('ships plant-specific filter and framing metadata for every preset', () => {
    for (const preset of CAMERA_PRESETS) {
      expect(preset.filterLabel.length).toBeGreaterThan(0);
      expect(preset.filterDescription.length).toBeGreaterThan(0);
      expect(preset.framingBadge.length).toBeGreaterThan(0);
      expect(preset.overlayHint.length).toBeGreaterThan(0);
      expect(preset.processingNote.length).toBeGreaterThan(0);
      expect(preset.captureCta).toContain(preset.title);
    }
  });
});
