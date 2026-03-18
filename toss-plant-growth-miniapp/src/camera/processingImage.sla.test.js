let mockDecodeAttempted = false;

jest.mock('heic-decode', () =>
  jest.fn(async () => {
    mockDecodeAttempted = true;
    return {
      width: 1,
      height: 1,
      data: Uint8ClampedArray.from([0, 255, 0, 255]),
    };
  }),
);

const decodeHeic = require('heic-decode');
const { prepareImageForProcessing } = require('./processingImage');

function createHeifBrandBase64(brand) {
  return Buffer.from([
    0x00,
    0x00,
    0x00,
    0x18,
    0x66,
    0x74,
    0x79,
    0x70,
    ...Buffer.from(brand),
    0x00,
    0x00,
    0x00,
    0x00,
  ]).toString('base64');
}

describe('camera/processingImage iPhone 13 mini SLA', () => {
  beforeEach(() => {
    mockDecodeAttempted = false;
    decodeHeic.mockClear();
  });

  it.each([
    ['image/heic', createHeifBrandBase64('heic')],
    ['image/heif', createHeifBrandBase64('mif1')],
  ])(
    'fast-falls back %s before any full decode attempt',
    async (mimeType, dataUri) => {
      const result = await prepareImageForProcessing({
        dataUri,
        mimeType,
      });

      expect(mockDecodeAttempted).toBe(false);
      expect(decodeHeic).not.toHaveBeenCalled();
      expect(result.previewImage).toEqual({
        dataUri,
        mimeType,
      });
      expect(result.processingImage).toBeNull();
      expect(result.normalized).toBe(false);
      expect(result.sourceMimeType).toBe(mimeType);
      expect(result.normalizationReason).toBe('heic_fast_fallback');
    },
  );
});
