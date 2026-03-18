import { fromByteArray, toByteArray } from 'base64-js';
import { decode as decodeJpeg, encode as encodeJpeg } from 'jpeg-js';
import type { CaptureQualityScore } from './quality';

export const MACRO_ENHANCEMENT_VERSION = 'macro_pop_v4';

export type EnhancementFailureStage =
  | 'input_base64'
  | 'decode'
  | 'transform'
  | 'encode_runtime'
  | 'encode'
  | null;

export type EnhancementProcessingProfile = 'light' | 'full';

export type EnhanceMacroPhotoResult = {
  dataUri: string;
  mimeType: string;
  applied: boolean;
  enhancementVersion: string | null;
  debug: {
    decodeFailed: boolean;
    failureStage: EnhancementFailureStage;
    errorMessage: string | null;
    processingProfile: EnhancementProcessingProfile;
    encodedBytes: number;
    width: number;
    height: number;
    usedUnsharpMask: boolean;
    whiteBalanceStrength: number;
    gamma: number;
    contrastStrength: number;
    detailStrength: number;
    localGainScale: number;
    greenBoostStrength: number;
    plantVibrance: number;
    backgroundVibrance: number;
    highlightCompression: number;
  };
};

let cachedJpegEncoderRuntimeError: string | null | undefined;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildFailureResult({
  dataUri,
  mimeType,
  failureStage,
  errorMessage,
  decodeFailed,
}: {
  dataUri: string;
  mimeType: string;
  failureStage: EnhancementFailureStage;
  errorMessage: string | null;
  decodeFailed: boolean;
}): EnhanceMacroPhotoResult {
  return {
    dataUri,
    mimeType,
    applied: false,
    enhancementVersion: null,
    debug: {
      decodeFailed,
      failureStage,
      errorMessage,
      processingProfile: 'full',
      encodedBytes: 0,
      width: 0,
      height: 0,
      usedUnsharpMask: false,
      whiteBalanceStrength: 0,
      gamma: 1,
      contrastStrength: 0,
      detailStrength: 0,
      localGainScale: 0,
      greenBoostStrength: 0,
      plantVibrance: 0,
      backgroundVibrance: 0,
      highlightCompression: 0,
    },
  };
}

function ensureJpegEncoderRuntime() {
  if (cachedJpegEncoderRuntimeError !== undefined) {
    return cachedJpegEncoderRuntimeError;
  }

  try {
    encodeJpeg(
      {
        data: new Uint8Array([0, 0, 0, 255]),
        width: 1,
        height: 1,
      },
      80,
    );
    cachedJpegEncoderRuntimeError = null;
  } catch (error) {
    cachedJpegEncoderRuntimeError =
      error instanceof Error ? error.message : String(error);
  }

  return cachedJpegEncoderRuntimeError;
}

export function resetEnhancementRuntimeForTests() {
  cachedJpegEncoderRuntimeError = undefined;
}

function isPlantLikePixel(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const spread = max - min;
  return green > red * 1.03 && green > blue * 1.02 && spread >= 8;
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

function buildLut(gamma: number) {
  const lut = new Uint8Array(256);

  for (let value = 0; value < 256; value += 1) {
    const normalized = value / 255;
    lut[value] = Math.round(clamp(normalized ** gamma * 255, 0, 255));
  }

  return lut;
}

function applyGreyWorldBalance(rgba: Uint8Array, strength = 1) {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  const step = 16;

  for (let index = 0; index < rgba.length; index += 4 * step) {
    sumR += rgba[index] ?? 0;
    sumG += rgba[index + 1] ?? 0;
    sumB += rgba[index + 2] ?? 0;
    count += 1;
  }

  if (count === 0) {
    return;
  }

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const gray = (avgR + avgG + avgB) / 3;
  const scaleR =
    1 + (clamp(gray / Math.max(avgR, 1), 0.88, 1.2) - 1) * strength;
  const scaleG =
    1 + (clamp(gray / Math.max(avgG, 1), 0.9, 1.12) - 1) * strength;
  const scaleB =
    1 + (clamp(gray / Math.max(avgB, 1), 0.88, 1.2) - 1) * strength;

  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = Math.round(clamp((rgba[index] ?? 0) * scaleR, 0, 255));
    rgba[index + 1] = Math.round(
      clamp((rgba[index + 1] ?? 0) * scaleG, 0, 255),
    );
    rgba[index + 2] = Math.round(
      clamp((rgba[index + 2] ?? 0) * scaleB, 0, 255),
    );
  }
}

function applyGammaCorrection(rgba: Uint8Array, gamma: number) {
  const lut = buildLut(gamma);

  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = lut[rgba[index] ?? 0] ?? rgba[index] ?? 0;
    rgba[index + 1] = lut[rgba[index + 1] ?? 0] ?? rgba[index + 1] ?? 0;
    rgba[index + 2] = lut[rgba[index + 2] ?? 0] ?? rgba[index + 2] ?? 0;
  }
}

function applyLocalContrastBoost(
  rgba: Uint8Array,
  width: number,
  height: number,
  strength: number,
  gainScale = 1,
) {
  if (width < 3 || height < 3) {
    return;
  }

  const luma = buildLumaMap(rgba, width, height);
  const baseGain = (22 + strength * 20) * gainScale;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const centerIndex = y * width + x;
      let neighborhood = 0;

      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          neighborhood += luma[(y + oy) * width + (x + ox)] ?? 0;
        }
      }

      const localMean = neighborhood / 9;
      const centerLuma = luma[centerIndex] ?? localMean;
      const localDetail = centerLuma - localMean;
      const pixelIndex = centerIndex * 4;
      const red = rgba[pixelIndex] ?? 0;
      const green = rgba[pixelIndex + 1] ?? 0;
      const blue = rgba[pixelIndex + 2] ?? 0;
      const plantWeight = isPlantLikePixel(red, green, blue) ? 1.15 : 0.78;
      const boost = clamp(localDetail * baseGain * plantWeight, -18, 24);

      rgba[pixelIndex] = Math.round(clamp(red + boost * 0.8, 0, 255));
      rgba[pixelIndex + 1] = Math.round(clamp(green + boost * 0.95, 0, 255));
      rgba[pixelIndex + 2] = Math.round(clamp(blue + boost * 0.8, 0, 255));
    }
  }
}

function applyGreenDetailBoost(rgba: Uint8Array, strength: number) {
  const greenGain = 1.08 + strength * 0.1;
  const redCompensate = 0.985 - strength * 0.02;
  const blueCompensate = 0.982 - strength * 0.02;

  for (let index = 0; index < rgba.length; index += 4) {
    const red = rgba[index] ?? 0;
    const green = rgba[index + 1] ?? 0;
    const blue = rgba[index + 2] ?? 0;
    const isGreenish = isPlantLikePixel(red, green, blue);

    if (!isGreenish) {
      continue;
    }

    rgba[index] = Math.round(clamp(red * redCompensate, 0, 255));
    rgba[index + 1] = Math.round(clamp(green * greenGain, 0, 255));
    rgba[index + 2] = Math.round(clamp(blue * blueCompensate, 0, 255));
  }
}

function applySelectiveVibrance(
  rgba: Uint8Array,
  plantBoost: number,
  backgroundBoost: number,
) {
  for (let index = 0; index < rgba.length; index += 4) {
    const red = rgba[index] ?? 0;
    const green = rgba[index + 1] ?? 0;
    const blue = rgba[index + 2] ?? 0;
    const isPlant = isPlantLikePixel(red, green, blue);
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const spread = max - min;
    const boost = isPlant ? plantBoost : backgroundBoost;
    const scale = 1 + boost * (1 - spread / 255);
    const mid = (max + min) / 2;

    rgba[index] = Math.round(clamp((red - mid) * scale + mid, 0, 255));
    rgba[index + 1] = Math.round(clamp((green - mid) * scale + mid, 0, 255));
    rgba[index + 2] = Math.round(clamp((blue - mid) * scale + mid, 0, 255));
  }
}

function buildLumaMap(rgba: Uint8Array, width: number, height: number) {
  const luma = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = rgba[index] ?? 0;
      const green = rgba[index + 1] ?? 0;
      const blue = rgba[index + 2] ?? 0;
      luma[y * width + x] = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
    }
  }

  return luma;
}

function applyUnsharpMask(
  rgba: Uint8Array,
  width: number,
  height: number,
  amount: number,
  strength: number,
) {
  if (width < 3 || height < 3) {
    return;
  }

  const luma = buildLumaMap(rgba, width, height);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const centerIndex = y * width + x;
      let sum = 0;

      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          sum += luma[(y + oy) * width + (x + ox)] ?? 0;
        }
      }

      const blurred = sum / 9;
      const detail = (luma[centerIndex] ?? 0) - blurred;
      const pixelIndex = centerIndex * 4;
      const red = rgba[pixelIndex] ?? 0;
      const green = rgba[pixelIndex + 1] ?? 0;
      const blue = rgba[pixelIndex + 2] ?? 0;
      const plantWeight = isPlantLikePixel(red, green, blue) ? 1.2 : 0.7;
      const maxBoost = 16 + strength * 10;
      const channelBoost = clamp(
        detail * 255 * amount * plantWeight,
        -maxBoost,
        maxBoost,
      );

      rgba[pixelIndex] = Math.round(clamp(red + channelBoost * 0.82, 0, 255));
      rgba[pixelIndex + 1] = Math.round(
        clamp(green + channelBoost * 0.94, 0, 255),
      );
      rgba[pixelIndex + 2] = Math.round(
        clamp(blue + channelBoost * 0.82, 0, 255),
      );
    }
  }
}

function applyHighlightCompression(
  rgba: Uint8Array,
  strength: number,
  compressionStrength = 1,
) {
  const highlightStart = 206 - strength * 18 * compressionStrength;

  for (let index = 0; index < rgba.length; index += 4) {
    const red = rgba[index] ?? 0;
    const green = rgba[index + 1] ?? 0;
    const blue = rgba[index + 2] ?? 0;
    const maxChannel = Math.max(red, green, blue);

    if (maxChannel <= highlightStart) {
      continue;
    }

    const overflow = maxChannel - highlightStart;
    const floor = clamp(0.72 + (1 - compressionStrength) * 0.15, 0.72, 0.9);
    const compressRatio = clamp(1 - overflow / 120, floor, 1);

    rgba[index] = Math.round(clamp(red * compressRatio, 0, 255));
    rgba[index + 1] = Math.round(clamp(green * compressRatio, 0, 255));
    rgba[index + 2] = Math.round(clamp(blue * compressRatio, 0, 255));
  }
}

function isNaturalPreserveCandidate(quality?: CaptureQualityScore) {
  return (
    quality != null &&
    quality.recommendation === 'good' &&
    quality.sharpness >= 70 &&
    quality.light >= 68 &&
    quality.reasons.length === 0
  );
}

function isBackgroundHeavyCandidate(quality?: CaptureQualityScore) {
  return (
    quality?.reasons.includes('plant_too_small') === true &&
    quality.sharpness >= 70
  );
}

function resolveProfileStrength(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 1;
  }

  if (isBackgroundHeavyCandidate(quality)) {
    return 0.72;
  }

  if (isNaturalPreserveCandidate(quality)) {
    return 0.72;
  }

  if (quality.reasons.includes('overexposed')) {
    return 0.88;
  }

  if (quality.sharpness < 45 || quality.light < 48) {
    return 1.16;
  }

  return 1;
}

function resolveWhiteBalanceStrength(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 0.52;
  }

  if (isBackgroundHeavyCandidate(quality)) {
    return 0.18;
  }

  if (isNaturalPreserveCandidate(quality)) {
    return 0.08;
  }

  if (quality.reasons.includes('low_light')) {
    return 0.62;
  }

  if (quality.reasons.includes('overexposed')) {
    return 0.28;
  }

  return 0.42;
}

function resolveGamma(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 1;
  }

  if (quality.reasons.includes('low_light')) {
    return 0.96;
  }

  if (quality.reasons.includes('overexposed')) {
    return 1.08;
  }

  if (quality.light < 52) {
    return 0.98;
  }

  return 1;
}

function resolveSharpenAmount(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 1.18;
  }

  if (isBackgroundHeavyCandidate(quality)) {
    return 0.96;
  }

  if (quality.sharpness < 45) {
    return 1.3;
  }

  if (quality.reasons.includes('overexposed')) {
    return 1.02;
  }

  if (quality.sharpness < 62) {
    return 1.22;
  }

  if (isNaturalPreserveCandidate(quality)) {
    return 1;
  }

  if (quality.sharpness > 78) {
    return 1.1;
  }

  return 1.14;
}

function resolveLocalGainScale(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 1.28;
  }

  if (isBackgroundHeavyCandidate(quality)) {
    return 1.02;
  }

  if (isNaturalPreserveCandidate(quality)) {
    return 1.02;
  }

  if (quality.reasons.includes('overexposed')) {
    return 1.14;
  }

  if (quality.reasons.includes('low_light')) {
    return 1.28;
  }

  return 1.24;
}

function resolveGreenBoostStrength(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 0.72;
  }

  if (isNaturalPreserveCandidate(quality)) {
    return 0.22;
  }

  if (quality.reasons.includes('low_light')) {
    return 0.92;
  }

  if (quality.reasons.includes('overexposed')) {
    return 0.42;
  }

  return 0.72;
}

function resolveVibrance(quality?: CaptureQualityScore) {
  if (quality == null) {
    return {
      plantVibrance: 0.5,
      backgroundVibrance: 0.04,
    };
  }

  if (isBackgroundHeavyCandidate(quality)) {
    return {
      plantVibrance: 0.16,
      backgroundVibrance: 0.01,
    };
  }

  if (isNaturalPreserveCandidate(quality)) {
    return {
      plantVibrance: 0.14,
      backgroundVibrance: 0,
    };
  }

  if (quality.reasons.includes('low_light')) {
    return {
      plantVibrance: 0.58,
      backgroundVibrance: 0.05,
    };
  }

  if (quality.reasons.includes('overexposed')) {
    return {
      plantVibrance: 0.34,
      backgroundVibrance: 0.02,
    };
  }

  return {
    plantVibrance: 0.44,
    backgroundVibrance: 0.03,
  };
}

function resolveHighlightCompression(quality?: CaptureQualityScore) {
  if (quality == null) {
    return 0.45;
  }

  if (isBackgroundHeavyCandidate(quality)) {
    return 0.34;
  }

  if (isNaturalPreserveCandidate(quality)) {
    return 0.2;
  }

  if (quality.reasons.includes('overexposed')) {
    return 0.8;
  }

  if (quality.reasons.includes('low_light')) {
    return 0.45;
  }

  return 0.42;
}

export function enhanceMacroPhoto({
  dataUri,
  mimeType,
  quality,
  profile = 'full',
}: {
  dataUri: string;
  mimeType: string;
  quality?: CaptureQualityScore;
  profile?: EnhancementProcessingProfile;
}): EnhanceMacroPhotoResult {
  const payload = extractPayload(dataUri);
  const bytes = decodeBase64(payload);

  if (bytes.length === 0) {
    return buildFailureResult({
      dataUri,
      mimeType,
      failureStage: 'input_base64',
      errorMessage: 'base64 payload could not be decoded',
      decodeFailed: true,
    });
  }

  try {
    const decoded = decodeJpeg(bytes, { useTArray: true });

    if (
      decoded.width <= 0 ||
      decoded.height <= 0 ||
      decoded.data.length === 0
    ) {
      return buildFailureResult({
        dataUri,
        mimeType,
        failureStage: 'decode',
        errorMessage: 'jpeg decode returned empty image data',
        decodeFailed: true,
      });
    }

    const rgba = new Uint8Array(decoded.data);
    const profileStrength = resolveProfileStrength(quality);
    const whiteBalanceStrength = resolveWhiteBalanceStrength(quality);
    const contrastScale = profile === 'light' ? 0.72 : 1;
    const detailScale = profile === 'light' ? 0.7 : 1;
    const vibranceScale = profile === 'light' ? 0.65 : 1;
    const backgroundVibranceScale = profile === 'light' ? 0.45 : 1;
    const greenBoostScale = profile === 'light' ? 0.72 : 1;
    const contrastStrength = (0.78 + profileStrength * 0.42) * contrastScale;
    const gamma = resolveGamma(quality);
    const sharpenAmount = resolveSharpenAmount(quality) * detailScale;
    const detailStrength = (0.68 + profileStrength * 0.44) * detailScale;
    const localGainScale = resolveLocalGainScale(quality);
    const greenBoostStrength =
      resolveGreenBoostStrength(quality) * greenBoostScale;
    const { plantVibrance, backgroundVibrance } = resolveVibrance(quality);
    const highlightCompression = resolveHighlightCompression(quality);
    const pixelCount = decoded.width * decoded.height;
    const useUnsharpMask = profile === 'full' && pixelCount <= 2_200_000;

    applyGreyWorldBalance(rgba, whiteBalanceStrength);
    applyLocalContrastBoost(
      rgba,
      decoded.width,
      decoded.height,
      contrastStrength,
      localGainScale,
    );
    applyGammaCorrection(rgba, gamma);
    applyGreenDetailBoost(rgba, greenBoostStrength);
    applySelectiveVibrance(
      rgba,
      plantVibrance * vibranceScale,
      backgroundVibrance * backgroundVibranceScale,
    );

    if (useUnsharpMask) {
      applyUnsharpMask(
        rgba,
        decoded.width,
        decoded.height,
        sharpenAmount,
        detailStrength,
      );
    }
    applyHighlightCompression(rgba, profileStrength, highlightCompression);

    const jpegEncoderRuntimeError = ensureJpegEncoderRuntime();

    if (jpegEncoderRuntimeError != null) {
      return buildFailureResult({
        dataUri,
        mimeType,
        failureStage: 'encode_runtime',
        errorMessage: jpegEncoderRuntimeError,
        decodeFailed: false,
      });
    }

    let encoded: ReturnType<typeof encodeJpeg>;

    try {
      encoded = encodeJpeg(
        {
          data: rgba,
          width: decoded.width,
          height: decoded.height,
        },
        90,
      );
    } catch (error) {
      return buildFailureResult({
        dataUri,
        mimeType,
        failureStage: 'encode',
        errorMessage: error instanceof Error ? error.message : String(error),
        decodeFailed: false,
      });
    }

    const encodedData = fromByteArray(encoded.data);

    return {
      dataUri: encodedData,
      mimeType: 'image/jpeg',
      applied: true,
      enhancementVersion: MACRO_ENHANCEMENT_VERSION,
      debug: {
        decodeFailed: false,
        failureStage: null,
        errorMessage: null,
        processingProfile: profile,
        encodedBytes: encoded.data.length,
        width: decoded.width,
        height: decoded.height,
        usedUnsharpMask: useUnsharpMask,
        whiteBalanceStrength,
        gamma,
        contrastStrength,
        detailStrength,
        localGainScale,
        greenBoostStrength,
        plantVibrance: plantVibrance * vibranceScale,
        backgroundVibrance: backgroundVibrance * backgroundVibranceScale,
        highlightCompression,
      },
    };
  } catch (error) {
    return buildFailureResult({
      dataUri,
      mimeType,
      failureStage: 'decode',
      errorMessage: error instanceof Error ? error.message : String(error),
      decodeFailed: true,
    });
  }
}
