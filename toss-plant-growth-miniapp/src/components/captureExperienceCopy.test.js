const {
  formatQualityReasons,
  getCameraPermissionCopy,
  getCaptureButtonLabel,
  getPresetFilterSummary,
  getRecommendationLabel,
} = require('./captureExperienceCopy');

describe('components/captureExperienceCopy', () => {
  it('returns a permission request CTA before camera access is granted', () => {
    expect(getCameraPermissionCopy('notDetermined').actionLabel).toBe(
      '권한 확인하고 시작하기',
    );
    expect(
      getCaptureButtonLabel({
        permissionStatus: 'notDetermined',
        isRunning: false,
        preset: { captureCta: '오늘 기록 모드로 촬영하기' },
      }),
    ).toBe('권한 확인하고 시작하기');
  });

  it('describes plant-friendly detail filtering only for light presets', () => {
    expect(
      getPresetFilterSummary({
        filterLabel: '리프 디테일',
        filterDescription:
          '잎맥과 새순 주변 디테일을 가볍게 살려서 식물 사진이 더 또렷하게 보이게 해요.',
      }),
    ).toContain('리프 디테일');
    expect(
      getPresetFilterSummary({
        filterLabel: '내추럴 그린',
        filterDescription:
          '색을 과하게 올리지 않고 오늘 식물의 실제 톤과 구도를 자연스럽게 남겨요.',
      }),
    ).toContain('내추럴 그린');
  });

  it('summarizes retake reasons in Korean copy', () => {
    expect(
      formatQualityReasons(['blurry', 'plant_too_small', 'low_light']),
    ).toBe('조금 흐림 · 식물이 작게 잡힘 · 어두움');
    expect(getRecommendationLabel('retake_recommended')).toBe(
      '한 번 더 찍으면 더 좋아져요',
    );
  });
});
