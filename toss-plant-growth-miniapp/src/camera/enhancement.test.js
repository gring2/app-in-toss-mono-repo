const { decode, encode } = require('jpeg-js');
const {
  MACRO_ENHANCEMENT_VERSION,
  enhanceMacroPhoto,
  resetEnhancementRuntimeForTests,
} = require('./enhancement');
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

  return encode({ data, width, height }, 88).data.toString('base64');
}

function decodeDataUriToImage(dataUri) {
  const payload = dataUri.split(',').pop() ?? dataUri;
  return decode(Buffer.from(payload, 'base64'), { useTArray: true });
}

function averageRegion(decoded, selector) {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  for (let y = 0; y < decoded.height; y += 1) {
    for (let x = 0; x < decoded.width; x += 1) {
      if (!selector(x, y)) {
        continue;
      }

      const index = (y * decoded.width + x) * 4;
      sumR += decoded.data[index] ?? 0;
      sumG += decoded.data[index + 1] ?? 0;
      sumB += decoded.data[index + 2] ?? 0;
      count += 1;
    }
  }

  return {
    r: sumR / Math.max(count, 1),
    g: sumG / Math.max(count, 1),
    b: sumB / Math.max(count, 1),
  };
}

describe('camera/enhancement', () => {
  afterEach(() => {
    resetEnhancementRuntimeForTests();
  });

  it('applies software enhancement and preserves valid JPEG output', () => {
    const dataUri = createDataUri(84, 84, (x, y) => {
      const centerX = 42;
      const centerY = 42;
      const distance = Math.hypot(x - centerX, y - centerY);

      if (distance < 25) {
        const variance = ((x * 3 + y * 5) % 9) * 2;
        return { r: 32 + variance, g: 96 + variance, b: 34 + variance };
      }

      return { r: 42, g: 42, b: 50 };
    });
    const before = scoreCaptureQuality({ dataUri, mimeType: 'image/jpeg' });
    const enhanced = enhanceMacroPhoto({
      dataUri,
      mimeType: 'image/jpeg',
      quality: before,
    });
    const after = scoreCaptureQuality({
      dataUri: enhanced.dataUri,
      mimeType: enhanced.mimeType,
    });

    expect(enhanced.applied).toBe(true);
    expect(enhanced.mimeType).toBe('image/jpeg');
    expect(enhanced.enhancementVersion).toBe(MACRO_ENHANCEMENT_VERSION);
    expect(enhanced.dataUri.length).toBeGreaterThan(0);
    expect(after.debug.decodeFailed).toBe(false);
    expect(enhanced.debug.failureStage).toBeNull();
    expect(after.score).toBeGreaterThan(0);
  });

  it('returns original data when payload decoding fails', () => {
    const enhanced = enhanceMacroPhoto({
      dataUri: 'invalid-data',
      mimeType: 'image/jpeg',
    });

    expect(enhanced.applied).toBe(false);
    expect(enhanced.dataUri).toBe('invalid-data');
    expect(enhanced.enhancementVersion).toBeNull();
    expect(enhanced.debug.decodeFailed).toBe(true);
    expect(enhanced.debug.failureStage).toBe('decode');
  });

  it('keeps already-good captures natural while still enhancing the plant area', () => {
    const dataUri = createDataUri(96, 96, (x, y) => {
      const dx = x - 48;
      const dy = y - 48;
      const distance = Math.hypot(dx, dy);

      if (distance < 24) {
        const stripe = (x + y) % 2 === 0 ? 16 : 0;
        const vein = Math.abs(x - 48) < 2 || Math.abs(y - 48) < 2 ? 20 : 0;
        return {
          r: 44 + stripe + vein,
          g: 116 + stripe + vein,
          b: 48 + stripe + vein,
        };
      }

      return { r: 172, g: 172, b: 176 };
    });

    const beforeQuality = scoreCaptureQuality({
      dataUri,
      mimeType: 'image/jpeg',
    });
    const enhanced = enhanceMacroPhoto({
      dataUri,
      mimeType: 'image/jpeg',
      quality: beforeQuality,
    });
    const beforeImage = decodeDataUriToImage(dataUri);
    const afterImage = decodeDataUriToImage(enhanced.dataUri);
    const backgroundSelector = (x, y) => x < 18 || x > 77 || y < 18 || y > 77;
    const plantSelector = (x, y) => Math.hypot(x - 48, y - 48) < 20;
    const beforeBackground = averageRegion(beforeImage, backgroundSelector);
    const afterBackground = averageRegion(afterImage, backgroundSelector);
    const beforePlant = averageRegion(beforeImage, plantSelector);
    const afterPlant = averageRegion(afterImage, plantSelector);

    expect(Math.abs(afterBackground.r - beforeBackground.r)).toBeLessThan(14);
    expect(Math.abs(afterBackground.g - beforeBackground.g)).toBeLessThan(14);
    expect(Math.abs(afterBackground.b - beforeBackground.b)).toBeLessThan(14);
    expect(afterPlant.g - beforePlant.g).toBeGreaterThan(6);
  });

  it('reports encode_runtime when Buffer is unavailable at runtime', () => {
    const dataUri = createDataUri(32, 32, () => ({
      r: 42,
      g: 122,
      b: 46,
    }));
    const quality = scoreCaptureQuality({ dataUri, mimeType: 'image/jpeg' });
    const originalBuffer = global.Buffer;

    try {
      global.Buffer = undefined;
      resetEnhancementRuntimeForTests();

      const enhanced = enhanceMacroPhoto({
        dataUri,
        mimeType: 'image/jpeg',
        quality,
      });

      expect(enhanced.applied).toBe(false);
      expect(enhanced.debug.decodeFailed).toBe(false);
      expect(enhanced.debug.failureStage).toBe('encode_runtime');
    } finally {
      global.Buffer = originalBuffer;
      resetEnhancementRuntimeForTests();
    }
  });

  it('uses a gentler enhancement profile for wide shots with a tiny subject', () => {
    const wideSceneDataUri = createDataUri(120, 120, (x, y) => {
      if (x > 54 && x < 66 && y > 54 && y < 66) {
        return { r: 42, g: 136, b: 44 };
      }

      const checker = (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0 ? 1 : 0;

      return {
        r: checker ? 210 : 120,
        g: checker ? 206 : 116,
        b: checker ? 198 : 108,
      };
    });
    const closePlantDataUri = createDataUri(120, 120, (x, y) => {
      const distance = Math.hypot(x - 60, y - 60);

      if (distance < 28) {
        const stripe = ((x + y) % 5) * 4;
        return { r: 40 + stripe, g: 124 + stripe, b: 44 + stripe };
      }

      return { r: 182, g: 180, b: 176 };
    });

    const wideQuality = scoreCaptureQuality({
      dataUri: wideSceneDataUri,
      mimeType: 'image/jpeg',
    });
    const closeQuality = scoreCaptureQuality({
      dataUri: closePlantDataUri,
      mimeType: 'image/jpeg',
    });
    const wideEnhanced = enhanceMacroPhoto({
      dataUri: wideSceneDataUri,
      mimeType: 'image/jpeg',
      quality: wideQuality,
    });
    const closeEnhanced = enhanceMacroPhoto({
      dataUri: closePlantDataUri,
      mimeType: 'image/jpeg',
      quality: closeQuality,
    });

    expect(wideQuality.reasons).toContain('plant_too_small');
    expect(wideQuality.sharpness).toBeGreaterThanOrEqual(70);
    expect(closeQuality.plantSubject).toBeGreaterThan(80);
    expect(closeQuality.reasons).not.toContain('plant_too_small');
    expect(wideEnhanced.debug.localGainScale).toBeLessThan(
      closeEnhanced.debug.localGainScale,
    );
    expect(wideEnhanced.debug.plantVibrance).toBeLessThan(
      closeEnhanced.debug.plantVibrance,
    );
  });
});
