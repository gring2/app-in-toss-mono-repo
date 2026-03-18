const { encode } = require('jpeg-js');
const { scoreCaptureQuality } = require('./quality');

function createDataUri(width, height, getPixel) {
  const data = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const { r, g, b } = getPixel(x, y);
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  return encode({ data, width, height }, 90).data.toString('base64');
}

describe('camera/quality', () => {
  it('detects a centered plant subject even when the image is still a bit soft', () => {
    const dataUri = createDataUri(72, 72, (x, y) => {
      const dx = x - 36;
      const dy = y - 36;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 22) {
        const stripe = (x + y) % 2 === 0 ? 18 : 0;
        const vein = Math.abs(x - 36) < 2 || Math.abs(y - 36) < 2 ? 22 : 0;
        return {
          r: 34 + stripe + vein,
          g: 112 + stripe + vein,
          b: 38 + stripe + vein,
        };
      }

      return { r: 72, g: 72, b: 78 };
    });
    const quality = scoreCaptureQuality({ dataUri, mimeType: 'image/jpeg' });

    expect(quality.score).toBeGreaterThanOrEqual(56);
    expect(quality.plantSubject).toBeGreaterThanOrEqual(60);
  });

  it('recommends retake when image is dark and low-detail', () => {
    const dataUri = createDataUri(72, 72, (x, y) => {
      const noise = (x * y) % 3;
      return {
        r: 16 + noise,
        g: 18 + noise,
        b: 18 + noise,
      };
    });
    const quality = scoreCaptureQuality({ dataUri, mimeType: 'image/jpeg' });

    expect(quality.score).toBeLessThan(62);
    expect(quality.recommendation).not.toBe('good');
    expect(quality.reasons.length).toBeGreaterThan(0);
  });

  it('recommends retake when the plant is too small in a wide scene', () => {
    const dataUri = createDataUri(96, 96, (x, y) => {
      if (x > 40 && x < 56 && y > 42 && y < 58) {
        const stripe = ((x + y) % 4) * 5;
        return { r: 36 + stripe, g: 132 + stripe, b: 42 + stripe };
      }

      return { r: 214, g: 206, b: 198 };
    });
    const quality = scoreCaptureQuality({ dataUri, mimeType: 'image/jpeg' });

    expect(quality.plantSubject).toBeLessThan(52);
    expect(quality.recommendation).not.toBe('good');
    expect(quality.reasons).toContain('plant_too_small');
  });

  it('does not treat a textured non-plant scene as a good plant capture', () => {
    const dataUri = createDataUri(84, 84, (x, y) => {
      const base = 88 + ((x * 7 + y * 11) % 40);
      return {
        r: base + 24,
        g: base - 6,
        b: base - 14,
      };
    });
    const quality = scoreCaptureQuality({ dataUri, mimeType: 'image/jpeg' });

    expect(quality.plantSubject).toBeLessThan(40);
    expect(quality.recommendation).not.toBe('good');
  });

  it('falls back safely when image decoding fails', () => {
    const quality = scoreCaptureQuality({
      dataUri: 'not-a-valid-image',
      mimeType: 'image/jpeg',
    });

    expect(quality.debug.decodeFailed).toBe(true);
    expect(quality.recommendation).toBe('good');
    expect(quality.score).toBeGreaterThan(0);
  });
});
