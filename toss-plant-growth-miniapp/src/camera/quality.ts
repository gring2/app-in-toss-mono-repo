import { toByteArray } from 'base64-js';
import { decode as decodeJpeg } from 'jpeg-js';

export type CaptureQualityReason =
  | 'blurry'
  | 'shaky'
  | 'low_light'
  | 'overexposed'
  | 'plant_too_small';

export type CaptureQualityRecommendation =
  | 'good'
  | 'retake_recommended'
  | 'retake_strongly_recommended';

export type CaptureQualityScore = {
  score: number;
  sharpness: number;
  stability: number;
  light: number;
  plantSubject: number;
  recommendation: CaptureQualityRecommendation;
  reasons: CaptureQualityReason[];
  debug: {
    sampledPixels: number;
    lumaMean: number;
    darkClipRatio: number;
    brightClipRatio: number;
    greenRatio: number;
    centerGreenRatio: number;
    centerTextureStd: number;
    subjectCoverage: number;
    decodeFailed: boolean;
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

function buildFallbackResult(): CaptureQualityScore {
  return {
    score: 68,
    sharpness: 68,
    stability: 68,
    light: 68,
    plantSubject: 68,
    recommendation: 'good',
    reasons: [],
    debug: {
      sampledPixels: 0,
      lumaMean: 0,
      darkClipRatio: 0,
      brightClipRatio: 0,
      greenRatio: 0,
      centerGreenRatio: 0,
      centerTextureStd: 0,
      subjectCoverage: 0,
      decodeFailed: true,
    },
  };
}

function buildRecommendation({
  score,
  sharpness,
  plantSubject,
  reasons,
}: {
  score: number;
  sharpness: number;
  plantSubject: number;
  reasons: CaptureQualityReason[];
}): CaptureQualityRecommendation {
  const hasBlur = reasons.includes('blurry');
  const hasSmallPlant = reasons.includes('plant_too_small');

  if (
    score < 40 ||
    plantSubject < 34 ||
    (hasBlur && hasSmallPlant) ||
    (sharpness < 12 && plantSubject < 75)
  ) {
    return 'retake_strongly_recommended';
  }

  if (score < 56 || sharpness < 24 || plantSubject < 52 || hasSmallPlant) {
    return 'retake_recommended';
  }

  return 'good';
}

export function scoreCaptureQuality({
  dataUri,
}: {
  dataUri: string;
  mimeType?: string;
}): CaptureQualityScore {
  const payload = extractPayload(dataUri);
  const decoded = decodeJpegPixels(payload);

  if (decoded == null) {
    return buildFallbackResult();
  }

  const { data, width, height } = decoded;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 140));
  const sampledWidth = Math.max(1, Math.ceil(width / step));
  const sampledHeight = Math.max(1, Math.ceil(height / step));
  const lumaGrid = new Array(sampledWidth * sampledHeight).fill(0);
  const satGrid = new Array(sampledWidth * sampledHeight).fill(0);
  const minCenterX = sampledWidth * 0.28;
  const maxCenterX = sampledWidth * 0.72;
  const minCenterY = sampledHeight * 0.28;
  const maxCenterY = sampledHeight * 0.72;

  let sampledPixels = 0;
  let greenCount = 0;
  let centerPixelCount = 0;
  let centerGreenCount = 0;
  let lumaSum = 0;
  let darkClipCount = 0;
  let brightClipCount = 0;
  let centerLumaSum = 0;
  let centerLumaSqSum = 0;
  let centerSatSum = 0;

  for (let sy = 0; sy < sampledHeight; sy += 1) {
    for (let sx = 0; sx < sampledWidth; sx += 1) {
      const sourceX = Math.min(sx * step, width - 1);
      const sourceY = Math.min(sy * step, height - 1);
      const index = (sourceY * width + sourceX) * 4;
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const luma = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      const { hue, saturation, value } = rgbToHsv(red, green, blue);
      const isGreenLike =
        hue >= 55 &&
        hue <= 168 &&
        saturation >= 0.12 &&
        value >= 0.12 &&
        green >= red * 0.86 &&
        green >= blue * 0.86;
      const gridIndex = sy * sampledWidth + sx;
      const isCenter =
        sx >= minCenterX &&
        sx <= maxCenterX &&
        sy >= minCenterY &&
        sy <= maxCenterY;

      lumaGrid[gridIndex] = luma;
      satGrid[gridIndex] = saturation;
      sampledPixels += 1;
      lumaSum += luma;

      if (luma < 0.05) {
        darkClipCount += 1;
      }

      if (luma > 0.95) {
        brightClipCount += 1;
      }

      if (isGreenLike) {
        greenCount += 1;
      }

      if (isCenter) {
        centerPixelCount += 1;
        centerLumaSum += luma;
        centerLumaSqSum += luma * luma;
        centerSatSum += saturation;

        if (isGreenLike) {
          centerGreenCount += 1;
        }
      }
    }
  }

  if (sampledPixels === 0) {
    return buildFallbackResult();
  }

  let laplaceSum = 0;
  let laplaceCount = 0;
  let gradXSum = 0;
  let gradYSum = 0;

  for (let y = 1; y < sampledHeight - 1; y += 1) {
    for (let x = 1; x < sampledWidth - 1; x += 1) {
      const index = y * sampledWidth + x;
      const center = lumaGrid[index] ?? 0;
      const left = lumaGrid[index - 1] ?? center;
      const right = lumaGrid[index + 1] ?? center;
      const up = lumaGrid[index - sampledWidth] ?? center;
      const down = lumaGrid[index + sampledWidth] ?? center;
      const laplace = Math.abs(4 * center - left - right - up - down);
      const gradX = Math.abs(right - left);
      const gradY = Math.abs(down - up);

      laplaceSum += laplace;
      laplaceCount += 1;
      gradXSum += gradX;
      gradYSum += gradY;
    }
  }

  const lumaMean = lumaSum / sampledPixels;
  const darkClipRatio = darkClipCount / sampledPixels;
  const brightClipRatio = brightClipCount / sampledPixels;
  const greenRatio = greenCount / sampledPixels;
  const centerGreenRatio =
    centerPixelCount > 0 ? centerGreenCount / centerPixelCount : greenRatio;
  const centerLumaMean =
    centerPixelCount > 0 ? centerLumaSum / centerPixelCount : lumaMean;
  const centerLumaVariance =
    centerPixelCount > 0
      ? Math.max(centerLumaSqSum / centerPixelCount - centerLumaMean ** 2, 0)
      : 0;
  const centerTextureStd = Math.sqrt(centerLumaVariance);
  const centerSatMean =
    centerPixelCount > 0 ? centerSatSum / centerPixelCount : 0;
  const laplaceMean = laplaceCount > 0 ? laplaceSum / laplaceCount : 0;
  const gradientBalance =
    Math.min(gradXSum, gradYSum) / Math.max(gradXSum, gradYSum, 1e-5);

  const sharpnessNorm = clamp((laplaceMean - 0.03) / 0.13, 0, 1);
  const stabilityNorm = clamp(
    gradientBalance * 0.75 + sharpnessNorm * 0.25,
    0,
    1,
  );
  const exposureNorm = clamp(1 - Math.abs(lumaMean - 0.55) / 0.55, 0, 1);
  const clippingPenalty = clamp(
    (darkClipRatio + brightClipRatio - 0.16) / 0.5,
    0,
    1,
  );
  const lightNorm = clamp(exposureNorm - clippingPenalty * 0.7, 0, 1);
  const greenScore = clamp(greenRatio / 0.2, 0, 1);
  const centerGreenScore = clamp(centerGreenRatio / 0.24, 0, 1);
  const textureScore = clamp(centerTextureStd / 0.16, 0, 1);
  const saturationScore = clamp(centerSatMean / 0.45, 0, 1);
  const coverageRaw = greenRatio * 0.55 + centerGreenRatio * 0.45;
  const subjectCoverageNorm = clamp((coverageRaw - 0.14) / 0.18, 0, 1);
  const subjectByGreen =
    greenScore * 0.45 + centerGreenScore * 0.4 + textureScore * 0.15;
  const subjectByTexture =
    (textureScore * 0.58 + saturationScore * 0.42) * subjectCoverageNorm;
  const subjectByCoverage = subjectCoverageNorm * 0.9;
  const greenWeightedSubject =
    subjectByGreen * (0.3 + subjectCoverageNorm * 0.7);
  const plantSubjectNorm = clamp(
    Math.max(greenWeightedSubject, subjectByTexture, subjectByCoverage),
    0,
    1,
  );

  const overallNorm =
    sharpnessNorm * 0.35 +
    stabilityNorm * 0.15 +
    lightNorm * 0.2 +
    plantSubjectNorm * 0.3;
  const calibratedNorm = clamp(overallNorm * 0.88 + 0.12, 0, 1);
  const score = Math.round(clamp(calibratedNorm * 100, 0, 100));
  const reasons: CaptureQualityReason[] = [];

  if (sharpnessNorm < 0.44) {
    reasons.push('blurry');
  }

  if (stabilityNorm < 0.42) {
    reasons.push('shaky');
  }

  if (lightNorm < 0.45) {
    reasons.push(lumaMean < 0.42 ? 'low_light' : 'overexposed');
  }

  if (plantSubjectNorm < 0.48) {
    reasons.push('plant_too_small');
  }

  const recommendation = buildRecommendation({
    score,
    sharpness: Math.round(sharpnessNorm * 100),
    plantSubject: Math.round(plantSubjectNorm * 100),
    reasons,
  });

  return {
    score,
    sharpness: Math.round(sharpnessNorm * 100),
    stability: Math.round(stabilityNorm * 100),
    light: Math.round(lightNorm * 100),
    plantSubject: Math.round(plantSubjectNorm * 100),
    recommendation,
    reasons,
    debug: {
      sampledPixels,
      lumaMean,
      darkClipRatio,
      brightClipRatio,
      greenRatio,
      centerGreenRatio,
      centerTextureStd,
      subjectCoverage: coverageRaw,
      decodeFailed: false,
    },
  };
}
