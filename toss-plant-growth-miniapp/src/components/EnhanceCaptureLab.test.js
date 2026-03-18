const React = require('react');
const { fireEvent, render, waitFor } = require('@testing-library/react-native');
const {
  OpenCameraPermissionError,
  openCamera,
} = require('@apps-in-toss/framework');
const { enhanceMacroPhoto } = require('../camera/enhancement');
const { prepareImageForProcessing } = require('../camera/processingImage');
const { scoreCaptureQuality } = require('../camera/quality');
const { detectPlantFromDataUri } = require('../detection/plantDetector');
const { emitMiniappEvent } = require('../analytics/events');
const { usePlantGrowth } = require('../hooks/usePlantGrowth');
const { normalizeCapturedImage } = require('../plants/image');
const { EnhanceCaptureLab } = require('./EnhanceCaptureLab');

jest.mock('@apps-in-toss/framework', () => {
  class MockOpenCameraPermissionError extends Error {}

  const openCamera = jest.fn();
  openCamera.getPermission = jest.fn();
  openCamera.openPermissionDialog = jest.fn();

  return {
    openCamera,
    OpenCameraPermissionError: MockOpenCameraPermissionError,
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
    mimeType: 'image/jpeg',
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

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('EnhanceCaptureLab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openCamera.getPermission.mockResolvedValue('allowed');
    openCamera.openPermissionDialog.mockResolvedValue('allowed');
    openCamera.mockResolvedValue({ dataUri: 'captured-data' });
    normalizeCapturedImage.mockImplementation((dataUri) => ({
      dataUri,
      mimeType: 'image/jpeg',
    }));

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
        dataUri: 'preview-data',
        mimeType: 'image/jpeg',
      },
      processingImage: {
        dataUri: 'processing-data',
        mimeType: 'image/jpeg',
      },
      normalized: false,
      sourceMimeType: 'image/jpeg',
      normalizationReason: 'already_jpeg',
    });
    scoreCaptureQuality.mockReturnValue({
      score: 82,
      sharpness: 76,
      stability: 79,
      light: 72,
      plantSubject: 88,
      reasons: [],
      recommendation: 'good',
      debug: { decodeFailed: false },
    });
    detectPlantFromDataUri.mockResolvedValue({
      confidence: 0.93,
      decision: 'pass',
      reasons: [],
    });
    enhanceMacroPhoto.mockReturnValue({
      applied: true,
      dataUri: 'enhanced-data',
      mimeType: 'image/jpeg',
      enhancementVersion: 'macro-vtest',
      debug: {
        failureStage: null,
      },
    });
  });

  it('shows loading copy while the single-camera capture is in progress', async () => {
    const deferred = createDeferred();
    openCamera.mockReturnValue(deferred.promise);

    const screen = render(<EnhanceCaptureLab />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    expect(screen.getByText('처리 중...')).toBeTruthy();
    expect(screen.getByText('사진을 촬영하는 중이에요...')).toBeTruthy();

    deferred.resolve({ dataUri: 'captured-data' });

    await waitFor(() => {
      expect(screen.getByText('✨ 식물 필터 미리보기 준비 완료')).toBeTruthy();
    });
  });

  it('renders the filtered preview with retake and save actions', async () => {
    const addDailyPhoto = jest.fn(() => ({
      didOverwriteSameDay: false,
      slotKey: 'slot-1',
    }));
    usePlantGrowth.mockReturnValue({
      isReady: true,
      activePlant: { id: 'plant-1', name: '몬스테라' },
      addDailyPhoto,
      createBaseline: jest.fn(),
    });

    const screen = render(<EnhanceCaptureLab />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    await waitFor(() => {
      expect(screen.getByText('오늘 기록 저장하기')).toBeTruthy();
    });

    expect(screen.getByText('필터 보기')).toBeTruthy();
    expect(screen.getByText('원본 보기')).toBeTruthy();
    expect(screen.getByText('다시 찍기')).toBeTruthy();

    fireEvent.press(screen.getByText('오늘 기록 저장하기'));

    await waitFor(() => {
      expect(screen.getByText('저장 완료')).toBeTruthy();
    });

    expect(addDailyPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        dataUri: 'enhanced-data',
        mimeType: 'image/jpeg',
        sourceDataUri: 'preview-data',
        enhancementVersion: 'macro-vtest',
        enhancementStatus: 'enhanced',
      }),
    );
    expect(emitMiniappEvent).toHaveBeenCalledWith(
      'capture_save_completed',
      expect.any(Object),
    );
  });

  it('creates a baseline on first save when there is no active plant', async () => {
    const createBaseline = jest.fn(() => ({ ok: true, slotKey: 'slot-1' }));
    usePlantGrowth.mockReturnValue({
      isReady: true,
      activePlant: null,
      addDailyPhoto: jest.fn(),
      createBaseline,
    });

    const screen = render(<EnhanceCaptureLab />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    await waitFor(() => {
      expect(screen.getByText('오늘 기록 저장하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('오늘 기록 저장하기'));

    await waitFor(() => {
      expect(screen.getByText('저장 완료')).toBeTruthy();
    });

    expect(createBaseline).toHaveBeenCalledWith(
      expect.objectContaining({
        dataUri: 'enhanced-data',
        mimeType: 'image/jpeg',
      }),
    );
  });

  it('falls back immediately to the original preview for heic captures', async () => {
    normalizeCapturedImage.mockReturnValue({
      dataUri: 'captured-heic',
      mimeType: 'image/heic',
    });
    prepareImageForProcessing.mockResolvedValue({
      previewImage: {
        dataUri: 'captured-heic',
        mimeType: 'image/heic',
      },
      processingImage: null,
      normalized: false,
      sourceMimeType: 'image/heic',
      normalizationReason: 'heic_fast_fallback',
    });

    const screen = render(<EnhanceCaptureLab />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    await waitFor(() => {
      expect(
        screen.getByText(
          '원본 미리보기를 먼저 보여드려요. 저장하거나 다시 찍을 수 있어요.',
        ),
      ).toBeTruthy();
    });

    expect(
      screen.getByText(
        /HEIC\/HEIF 사진은 빠른 필터 미리보기 보장 대상이 아니라/,
      ),
    ).toBeTruthy();
    expect(scoreCaptureQuality).not.toHaveBeenCalled();
    expect(detectPlantFromDataUri).not.toHaveBeenCalled();
    expect(enhanceMacroPhoto).not.toHaveBeenCalled();
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

  it('shows a permission error panel when camera access is denied', async () => {
    openCamera.mockRejectedValue(new OpenCameraPermissionError());

    const screen = render(<EnhanceCaptureLab />);

    await waitFor(() => {
      expect(screen.getByText('식물 사진 촬영하기')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('식물 사진 촬영하기'));

    await waitFor(() => {
      expect(screen.getByText('안내')).toBeTruthy();
    });

    expect(
      screen.getByText(
        '카메라 권한이 없어요. 권한을 허용한 뒤 다시 시도해주세요.',
      ),
    ).toBeTruthy();
    expect(prepareImageForProcessing).not.toHaveBeenCalled();
  });
});
