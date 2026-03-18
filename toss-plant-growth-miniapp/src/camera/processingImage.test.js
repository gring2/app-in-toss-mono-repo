jest.mock('heic-decode', () =>
  jest.fn(async () => ({
    width: 1,
    height: 1,
    data: Uint8ClampedArray.from([0, 255, 0, 255]),
  })),
);

const decodeHeic = require('heic-decode');
const { prepareImageForProcessing } = require('./processingImage');

describe('camera/processingImage', () => {
  it('passes through jpeg without normalization', async () => {
    const result = await prepareImageForProcessing({
      dataUri: '/9j/4AAQSkZJRgABAQAAAQABAAD/',
      mimeType: 'image/jpeg',
    });

    expect(result.processingImage).not.toBeNull();
    expect(result.processingImage.mimeType).toBe('image/jpeg');
    expect(result.processingImage.dataUri).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/');
    expect(result.previewImage.dataUri).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/');
    expect(result.normalized).toBe(false);
    expect(result.normalizationReason).toBe('already_jpeg');
  });

  it('routes heic to a fast original-preview fallback without decoding', async () => {
    const heicHeader = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
      0x00, 0x00, 0x00, 0x00,
    ]).toString('base64');
    const result = await prepareImageForProcessing({
      dataUri: heicHeader,
      mimeType: 'image/heic',
    });

    expect(result.processingImage).toBeNull();
    expect(result.previewImage.mimeType).toBe('image/heic');
    expect(result.previewImage.dataUri).toBe(heicHeader);
    expect(result.normalized).toBe(false);
    expect(result.normalizationReason).toBe('heic_fast_fallback');
    expect(decodeHeic).not.toHaveBeenCalled();
  });

  it('returns unsupported for webp until a decoder exists', async () => {
    const webpHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]).toString('base64');
    const result = await prepareImageForProcessing({
      dataUri: webpHeader,
      mimeType: 'image/webp',
    });

    expect(result.processingImage).toBeNull();
    expect(result.normalizationReason).toBe('unsupported_format');
  });
});
