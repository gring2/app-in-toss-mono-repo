import { toByteArray } from 'base64-js';
import { decode as decodeJpeg } from 'jpeg-js';

export type HeuristicPlantDetectResult = {
  confidence: number;
  debug: {
    greenRatio: number;
    centerGreenRatio: number;
    neutralRatio: number;
    textureStd: number;
    pixelCount: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extractPayload(dataUri: string) {
  const source = dataUri.trim();
  const commaIndex = source.indexOf(',');
  const payload = commaIndex >= 0 ? source.slice(commaIndex + 1) : source;

  return payload.replace(/[^A-Za-z0-9+/=]/g, '');
}

function decodeBase64(payload: string) {
  if (payload.length === 0) {
    return new Uint8Array(0);
  }

  const paddedLength = Math.ceil(payload.length / 4) * 4;
  const normalized = payload.padEnd(paddedLength, '=');

  try {
    return toByteArray(normalized);
  } catch {
    return new Uint8Array(0);
  }
}

function rgbToHsv(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;

  if (delta > 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    hue *= 60;

    if (hue < 0) {
      hue += 360;
    }
  }

  const saturation = max === 0 ? 0 : delta / max;
  const value = max;

  return { hue, saturation, value };
}

function decodeJpegPixels(payload: string) {
  const bytes = decodeBase64(payload);

  if (bytes.length === 0) {
    return null;
  }

  try {
    const decoded = decodeJpeg(bytes, { useTArray: true });

    if (
      decoded.width <= 0 ||
      decoded.height <= 0 ||
      decoded.data.length === 0
    ) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function detectPlantByHeuristic(
  dataUri: string,
): HeuristicPlantDetectResult {
  const payload = extractPayload(dataUri);
  const decoded = decodeJpegPixels(payload);

  if (decoded == null) {
    return {
      confidence: 0.72,
      debug: {
        greenRatio: 0,
        centerGreenRatio: 0,
        neutralRatio: 0,
        textureStd: 0,
        pixelCount: 0,
      },
    };
  }

  const { data, width, height } = decoded;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 96));
  const minCenterX = width * 0.25;
  const maxCenterX = width * 0.75;
  const minCenterY = height * 0.25;
  const maxCenterY = height * 0.75;

  let pixelCount = 0;
  let greenCount = 0;
  let centerPixelCount = 0;
  let centerGreenCount = 0;
  let neutralCount = 0;
  let lumaSum = 0;
  let lumaSqSum = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const { hue, saturation, value } = rgbToHsv(red, green, blue);
      const isGreenLike =
        hue >= 65 &&
        hue <= 165 &&
        saturation >= 0.14 &&
        value >= 0.12 &&
        green >= red * 0.9 &&
        green >= blue * 0.9;
      const colorSpread =
        Math.max(red, green, blue) - Math.min(red, green, blue);
      const isNeutralLike = colorSpread <= 16;
      const luma = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      const isCenter =
        x >= minCenterX &&
        x <= maxCenterX &&
        y >= minCenterY &&
        y <= maxCenterY;

      pixelCount += 1;
      lumaSum += luma;
      lumaSqSum += luma * luma;

      if (isGreenLike) {
        greenCount += 1;
      }

      if (isNeutralLike) {
        neutralCount += 1;
      }

      if (isCenter) {
        centerPixelCount += 1;

        if (isGreenLike) {
          centerGreenCount += 1;
        }
      }
    }
  }

  if (pixelCount === 0) {
    return {
      confidence: 0.72,
      debug: {
        greenRatio: 0,
        centerGreenRatio: 0,
        neutralRatio: 0,
        textureStd: 0,
        pixelCount,
      },
    };
  }

  const greenRatio = greenCount / pixelCount;
  const centerGreenRatio =
    centerPixelCount > 0 ? centerGreenCount / centerPixelCount : greenRatio;
  const neutralRatio = neutralCount / pixelCount;
  const lumaMean = lumaSum / pixelCount;
  const lumaVariance = Math.max(
    lumaSqSum / pixelCount - lumaMean * lumaMean,
    0,
  );
  const textureStd = Math.sqrt(lumaVariance);

  const greenScore = clamp(greenRatio / 0.24, 0, 1);
  const centerGreenScore = clamp(centerGreenRatio / 0.28, 0, 1);
  const textureScore = clamp(textureStd / 0.2, 0, 1);
  const neutralPenalty = clamp((neutralRatio - 0.32) / 0.5, 0, 1);
  const baseConfidence = clamp(
    0.15 +
      greenScore * 0.48 +
      centerGreenScore * 0.24 +
      textureScore * 0.18 -
      neutralPenalty * 0.22,
    0,
    1,
  );
  const hasPlantLikeCore =
    centerGreenRatio >= 0.055 ||
    (greenRatio >= 0.045 && textureStd >= 0.075) ||
    greenRatio >= 0.08;
  const confidence = hasPlantLikeCore
    ? Math.max(baseConfidence, 0.64)
    : baseConfidence;

  return {
    confidence,
    debug: {
      greenRatio,
      centerGreenRatio,
      neutralRatio,
      textureStd,
      pixelCount,
    },
  };
}
