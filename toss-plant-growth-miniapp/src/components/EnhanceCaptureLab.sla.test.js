const React = require('react');
const { fireEvent, render, waitFor } = require('@testing-library/react-native');
const { openCamera } = require('@apps-in-toss/framework');
const { prepareImageForProcessing } = require('../camera/processingImage');
const { scoreCaptureQuality } = require('../camera/quality');
const { detectPlantFromDataUri } = require('../detection/plantDetector');
const { enhanceMacroPhoto } = require('../camera/enhancement');
const { emitMiniappEvent } = require('../analytics/events');
const { usePlantGrowth } = require('../hooks/usePlantGrowth');
const { EnhanceCaptureLab } = require('./EnhanceCaptureLab');

jest.mock('@apps-in-toss/framework', () => {
  const openCamera = jest.fn();
  openCamera.getPermission = jest.fn();
  openCamera.openPermissionDialog = jest.fn();

  return {
    openCamera,
    OpenCameraPermissionError: class MockOpenCameraPermissionError extends Error {},
  };
});

jest.mock('@toss/tds-react-native', () => {
  const React = require('react');
  const { Pressable, Text: NativeText, View } = require('react-native');

  const Text = ({ children }) => <NativeText>{children}</NativeText>;
  const Button = ({ children, disabled, onPress, viewStyle }) => (
    <Pressable disabled={disabled} onPress={onPress} style={viewStyle}>
      <NativeText>{children}</NativeText>
    </Pressable>
  );
  const List = ({ children, style }) => <View style={style}>{children}</View>;
  const Texts = ({ top, middle, bottom }) => (
    <View>
      {top ? <NativeText>{top}</NativeText> : null}
      {middle ? <NativeText>{middle}</NativeText> : null}
      {bottom ? <NativeText>{bottom}</NativeText> : null}
    </View>
  );
  const ListRow = ({ contents }) => <View>{contents}</View>;
  ListRow.Texts = Texts;

  return {
    Button,
    List,
    ListRow,
    Text,
    colors: {
      background: '#ffffff',
      grey700: '#666666',
      grey600: '#777777',
      grey200: '#dddddd',
      grey100: '#f4f4f4',
      red200: '#ffbbbb',
      red50: '#fff1f1',
    },
  };
});

jest.mock('../camera/processingImage', () => ({
  prepareImageForProcessing: jest.fn(),
}));

jest.mock('../camera/quality', () => ({
  scoreCaptureQuality: jest.fn(),
}));

jest.mock('../detection/plantDetector', () => ({
  detectPlantFromDataUri: jest.fn(),
}));

jest.mock('../camera/enhancement', () => ({
  MACRO_ENHANCEMENT_VERSION: 'macro-vtest',
  enhanceMacroPhoto: jest.fn(),
}));

jest.mock('../plants/image', () => ({
  normalizeCapturedImage: jest.fn((dataUri) => ({
    dataUri,
    mimeType: 'image/heic',
  })),
  toDisplayImageUri: jest.fn(
    (dataUri, mimeType) => `data:${mimeType};base64,${dataUri}`,
  ),
}));

jest.mock('../analytics/events', () => ({
  emitMiniappEvent: jest.fn(),
}));

jest.mock('../hooks/usePlantGrowth', () => ({
  usePlantGrowth: jest.fn(),
}));

describe('EnhanceCaptureLab iPhone 13 mini SLA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openCamera.getPermission.mockResolvedValue('allowed');
    openCamera.openPermissionDialog.mockResolvedValue('allowed');
    openCamera.mockResolvedValue({ dataUri: 'captured-heic-data' });
    usePlantGrowth.mockReturnValue({
      isReady: true,
      activePlant: { id: 'plant-1', name: '몬스테라' },
      addDailyPhoto: jest.fn(() => ({
        didOverwriteSameDay: false,
        slotKey: 'slot-1',
      })),
      createBaseline: jest.fn(() => ({ ok: true, slotKey: 'slot-1' })),
    });
    prepareImageForProcessing.mockResolvedValue({
      previewImage: {
        dataUri: 'captured-heic-data',
        mimeType: 'image/heic',
      },
      processingImage: null,
      normalized: false,
      sourceMimeType: 'image/heic',
      normalizationReason: 'heic_fast_fallback',
    });
  });

  it('shows HEIC fallback guidance that redirects users to the JPEG/high-compatibility path', async () => {
    const screen = render(<EnhanceCaptureLab />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    await waitFor(() => {
      expect(screen.getByText('촬영 가이드')).toBeTruthy();
    });

    expect(
      screen.getByText(
        /HEIC\/HEIF 사진은 빠른 필터 미리보기 보장 대상이 아니라 이번에는 원본 미리보기로 먼저 보여드려요\./,
      ),
    ).toBeTruthy();
    expect(screen.getAllByText(/높은 호환성\(JPEG\)/).length).toBeGreaterThan(
      0,
    );
    expect(detectPlantFromDataUri).not.toHaveBeenCalled();
    expect(scoreCaptureQuality).not.toHaveBeenCalled();
    expect(enhanceMacroPhoto).not.toHaveBeenCalled();
  });

  it('emits source-path instrumentation when HEIC falls back before filtered preview processing', async () => {
    const screen = render(<EnhanceCaptureLab screenName="capture" />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    await waitFor(() => {
      expect(screen.getByText('🌿 원본 미리보기 준비 완료')).toBeTruthy();
    });

    expect(emitMiniappEvent).toHaveBeenCalledWith(
      'capture_filter_preview_fallback',
      expect.objectContaining({
        source_mime_type: 'image/heic',
        normalization_reason: 'heic_fast_fallback',
        preview_mode: 'original_fallback',
        sla_target: 'jpeg_high_compatibility_only',
      }),
    );
  });
});
