const { encode } = require('jpeg-js');
const { detectPlantByHeuristic } = require('./heuristicPlantDetector');

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

describe('detection/providers/heuristicPlantDetector', () => {
  it('gives high confidence for a close leaf-like scene', () => {
    const dataUri = createDataUri(80, 80, (x, y) => {
      const dx = x - 40;
      const dy = y - 40;
      const distance = Math.hypot(dx * 0.75, dy);

      if (distance < 28) {
        const vein = Math.abs(dx) < 3 ? 46 : 0;
        return {
          r: 24 + vein,
          g: 106 + vein,
          b: 30 + vein,
        };
      }

      return { r: 200, g: 196, b: 186 };
    });
    const result = detectPlantByHeuristic(dataUri);

    expect(result.confidence).toBeGreaterThanOrEqual(0.56);
  });

  it('keeps confidence low for a brown textured non-plant scene', () => {
    const dataUri = createDataUri(84, 84, (x, y) => {
      const base = 82 + ((x * 9 + y * 5) % 36);
      return {
        r: base + 26,
        g: base - 8,
        b: base - 14,
      };
    });
    const result = detectPlantByHeuristic(dataUri);

    expect(result.confidence).toBeLessThan(0.56);
  });
});
