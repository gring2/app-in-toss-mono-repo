const {
  inferCapturedImageMimeType,
  normalizeCapturedImage,
} = require('./image');

describe('plants/image', () => {
  it('keeps explicit data-uri mime type', () => {
    const normalized = normalizeCapturedImage(
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/',
    );

    expect(normalized.mimeType).toBe('image/jpeg');
  });

  it('infers jpeg from raw base64 bytes', () => {
    const mimeType = inferCapturedImageMimeType('/9j/4AAQSkZJRgABAQAAAQABAAD/');

    expect(mimeType).toBe('image/jpeg');
  });

  it('infers heic brand from raw base64 bytes', () => {
    const heicHeader = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
      0x00, 0x00, 0x00, 0x00,
    ]).toString('base64');

    expect(inferCapturedImageMimeType(heicHeader)).toBe('image/heic');
  });

  it('infers webp from raw base64 bytes', () => {
    const webpHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]).toString('base64');

    expect(inferCapturedImageMimeType(webpHeader)).toBe('image/webp');
  });
});
