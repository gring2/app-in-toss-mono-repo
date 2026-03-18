const { encode } = require('jpeg-js');
const { computeChangeScore, computeQuickSceneCheck } = require('./scoring');

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

function buildPlantScene(variant) {
  return createDataUri(96, 96, (x, y) => {
    const centerDistance = Math.hypot(x - 48, y - 48);

    if (centerDistance < 24) {
      if (variant === 'changed-center') {
        const checker = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
        return checker ? { r: 220, g: 36, b: 36 } : { r: 246, g: 236, b: 210 };
      }

      if (variant === 'center-glare') {
        const glareBand = (x + y) % 11 < 3;

        if (glareBand) {
          return { r: 236, g: 236, b: 230 };
        }
      }

      const detail = ((x * 5 + y * 3) % 8) * 3;
      return { r: 42 + detail, g: 150 + detail, b: 44 + detail / 2 };
    }

    if (variant === 'framing-shift') {
      const band = x % 12 < 6 ? 32 : 92;
      return { r: 16 + band, g: 24 + (y % 10) * 3, b: 88 + (x % 20) };
    }

    return { r: 70 + (x % 7), g: 72 + (y % 6), b: 76 + ((x + y) % 5) };
  });
}

describe('reports/scoring', () => {
  it('does not over-amplify change when center subject remains similar', () => {
    const before = buildPlantScene('base');
    const framingShift = buildPlantScene('framing-shift');

    const quick = computeQuickSceneCheck(before, framingShift);
    const score = computeChangeScore(before, framingShift);

    expect(quick.quickScore).toBeGreaterThan(0);
    expect(score).toBeLessThan(80);
  });

  it('keeps high score when center subject is truly different', () => {
    const before = buildPlantScene('base');
    const changedCenter = buildPlantScene('changed-center');
    const score = computeChangeScore(before, changedCenter);

    expect(score).toBeGreaterThanOrEqual(55);
  });

  it('does not over-boost change score for temporary center glare noise', () => {
    const before = buildPlantScene('base');
    const centerGlare = buildPlantScene('center-glare');
    const score = computeChangeScore(before, centerGlare);

    expect(score).toBeLessThanOrEqual(70);
  });
});
