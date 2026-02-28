import { toByteArray } from 'base64-js';
import { decode as decodeJpeg } from 'jpeg-js';

export type ChangeLevel = 'low' | 'medium' | 'high';

const TARGET_SIZE = 16;
const CLEARLY_DIFFERENT_SCORE = 80;
const SCORE_CACHE_MAX = 64;
const QUICK_SAMPLE_COUNT = 128;
const QUICK_DIFFERENT_THRESHOLD = 0.2;
const MAX_DECODE_PAYLOAD_LENGTH = 1_200_000;
const scoreCache = new Map<string, number>();

type ImageFeatures = {
  luma: number[];
  colorHistogram: number[];
};

export type QuickSceneCheck = {
  quickScore: number;
  quickDistance: number;
  isClearlyDifferent: boolean;
  obviousSceneScore: number;
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

function buildCacheKey(beforePayload: string, afterPayload: string) {
  const beforeHead = beforePayload.slice(0, 96);
  const beforeTail = beforePayload.slice(-96);
  const afterHead = afterPayload.slice(0, 96);
  const afterTail = afterPayload.slice(-96);

  return `${beforePayload.length}:${beforeHead}:${beforeTail}|${afterPayload.length}:${afterHead}:${afterTail}`;
}

function readCachedScore(key: string) {
  const cached = scoreCache.get(key);

  if (cached != null) {
    scoreCache.delete(key);
    scoreCache.set(key, cached);
  }

  return cached ?? null;
}

function writeCachedScore(key: string, score: number) {
  if (scoreCache.size >= SCORE_CACHE_MAX) {
    const firstKey = scoreCache.keys().next().value;

    if (typeof firstKey === 'string') {
      scoreCache.delete(firstKey);
    }
  }

  scoreCache.set(key, score);
}

function decodeBase64Char(charCode: number) {
  if (charCode >= 65 && charCode <= 90) {
    return charCode - 65;
  }

  if (charCode >= 97 && charCode <= 122) {
    return charCode - 71;
  }

  if (charCode >= 48 && charCode <= 57) {
    return charCode + 4;
  }

  if (charCode === 43) {
    return 62;
  }

  if (charCode === 47) {
    return 63;
  }

  return 0;
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

function distance(vectorA: number[], vectorB: number[]) {
  const length = Math.min(vectorA.length, vectorB.length);

  if (length === 0) {
    return 0;
  }

  let sum = 0;

  for (let i = 0; i < length; i += 1) {
    sum += Math.abs((vectorA[i] ?? 0) - (vectorB[i] ?? 0));
  }

  return sum / length;
}

function normalizeVector(vector: number[]) {
  if (vector.length === 0) {
    return [];
  }

  const mean = vector.reduce((sum, value) => sum + value, 0) / vector.length;
  const variance =
    vector.reduce((sum, value) => {
      const diff = value - mean;
      return sum + diff * diff;
    }, 0) / vector.length;
  const std = Math.sqrt(Math.max(variance, 1e-6));

  return vector.map((value) => (value - mean) / std);
}

function buildEdgeSignal(vector: number[], width: number, height: number) {
  if (width <= 1 || height <= 1 || vector.length === 0) {
    return [0];
  }

  const edges: number[] = [];

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const index = y * width + x;
      const value = vector[index] ?? 0;
      const right = vector[index + 1] ?? value;
      const below = vector[index + width] ?? value;
      const dx = right - value;
      const dy = below - value;

      edges.push(Math.sqrt(dx * dx + dy * dy));
    }
  }

  return edges;
}

function buildPayloadSketch(payload: string, sampleCount = QUICK_SAMPLE_COUNT) {
  if (payload.length === 0) {
    return new Array(sampleCount).fill(0);
  }

  const sketch = new Array(sampleCount).fill(0);
  const step = Math.max(1, Math.floor(payload.length / sampleCount));

  for (let i = 0; i < sampleCount; i += 1) {
    const sourceIndex = Math.min(i * step, payload.length - 1);
    const charCode = payload.charCodeAt(sourceIndex);
    sketch[i] = decodeBase64Char(charCode) / 63;
  }

  return sketch;
}

function buildResizedFeatures(
  rgba: Uint8Array,
  width: number,
  height: number,
  targetSize = TARGET_SIZE,
): ImageFeatures {
  const luma = new Array(targetSize * targetSize).fill(0);
  const colorBins = new Array(24).fill(0);
  const xScale = width / targetSize;
  const yScale = height / targetSize;
  const sampleCount = targetSize * targetSize;

  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      const sourceX = Math.min(Math.floor((x + 0.5) * xScale), width - 1);
      const sourceY = Math.min(Math.floor((y + 0.5) * yScale), height - 1);
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const red = rgba[sourceIndex] ?? 0;
      const green = rgba[sourceIndex + 1] ?? 0;
      const blue = rgba[sourceIndex + 2] ?? 0;
      const lumaValue = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      const index = y * targetSize + x;

      luma[index] = lumaValue;

      const redBin = Math.min(Math.floor((red / 256) * 8), 7);
      const greenBin = Math.min(Math.floor((green / 256) * 8), 7);
      const blueBin = Math.min(Math.floor((blue / 256) * 8), 7);
      colorBins[redBin] += 1;
      colorBins[8 + greenBin] += 1;
      colorBins[16 + blueBin] += 1;
    }
  }

  const colorHistogram = colorBins.map((value) => value / sampleCount);

  return {
    luma,
    colorHistogram,
  };
}

function decodeResizedJpegFeatures(payload: string) {
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

    return buildResizedFeatures(
      decoded.data,
      decoded.width,
      decoded.height,
      TARGET_SIZE,
    );
  } catch {
    return null;
  }
}

function computeFallbackScore(beforePayload: string, afterPayload: string) {
  const beforeSketch = buildPayloadSketch(beforePayload);
  const afterSketch = buildPayloadSketch(afterPayload);
  const sketchDistance = distance(beforeSketch, afterSketch);
  const lengthDistance =
    Math.abs(beforePayload.length - afterPayload.length) /
    Math.max(beforePayload.length, afterPayload.length, 1);
  const quickDistance = sketchDistance * 0.9 + lengthDistance * 0.1;

  return Math.round(clamp(quickDistance * 120, 0, 100));
}

function computeQuickSceneCheckFromPayload(
  beforePayload: string,
  afterPayload: string,
): QuickSceneCheck {
  const quickScore = computeFallbackScore(beforePayload, afterPayload);
  const quickDistance = clamp(quickScore / 120, 0, 1);
  const isClearlyDifferent = quickDistance >= QUICK_DIFFERENT_THRESHOLD;
  const obviousSceneScore = isClearlyDifferent
    ? Math.round(
        clamp(85 + (quickDistance - QUICK_DIFFERENT_THRESHOLD) * 30, 0, 100),
      )
    : quickScore;

  return {
    quickScore,
    quickDistance,
    isClearlyDifferent,
    obviousSceneScore,
  };
}

export function isClearlyDifferentShot(score: number) {
  return score >= CLEARLY_DIFFERENT_SCORE;
}

export function computeQuickSceneCheck(
  beforeDataUri: string,
  afterDataUri: string,
) {
  const beforePayload = extractPayload(beforeDataUri);
  const afterPayload = extractPayload(afterDataUri);

  if (beforePayload === afterPayload) {
    return {
      quickScore: 0,
      quickDistance: 0,
      isClearlyDifferent: false,
      obviousSceneScore: 0,
    } satisfies QuickSceneCheck;
  }

  return computeQuickSceneCheckFromPayload(beforePayload, afterPayload);
}

export function computeChangeScore(
  beforeDataUri: string,
  afterDataUri: string,
) {
  const beforePayload = extractPayload(beforeDataUri);
  const afterPayload = extractPayload(afterDataUri);

  if (beforePayload === afterPayload) {
    return 0;
  }

  const cacheKey = buildCacheKey(beforePayload, afterPayload);
  const cachedScore = readCachedScore(cacheKey);

  if (cachedScore != null) {
    return cachedScore;
  }

  const quickCheck = computeQuickSceneCheckFromPayload(
    beforePayload,
    afterPayload,
  );
  const quickScore = quickCheck.quickScore;

  if (quickCheck.isClearlyDifferent) {
    writeCachedScore(cacheKey, quickCheck.obviousSceneScore);
    return quickCheck.obviousSceneScore;
  }

  if (
    beforePayload.length > MAX_DECODE_PAYLOAD_LENGTH ||
    afterPayload.length > MAX_DECODE_PAYLOAD_LENGTH
  ) {
    writeCachedScore(cacheKey, quickScore);
    return quickScore;
  }

  const beforeFeatures = decodeResizedJpegFeatures(beforePayload);
  const afterFeatures = decodeResizedJpegFeatures(afterPayload);

  if (beforeFeatures != null && afterFeatures != null) {
    const normalizedBefore = normalizeVector(beforeFeatures.luma);
    const normalizedAfter = normalizeVector(afterFeatures.luma);
    const edgeBefore = buildEdgeSignal(
      normalizedBefore,
      TARGET_SIZE,
      TARGET_SIZE,
    );
    const edgeAfter = buildEdgeSignal(
      normalizedAfter,
      TARGET_SIZE,
      TARGET_SIZE,
    );
    const lumaDistance = clamp(
      distance(normalizedBefore, normalizedAfter) / 2,
      0,
      1,
    );
    const edgeDistance = clamp(distance(edgeBefore, edgeAfter) / 2, 0, 1);
    const colorDistance = clamp(
      distance(beforeFeatures.colorHistogram, afterFeatures.colorHistogram) *
        2.5,
      0,
      1,
    );
    const combinedDistance =
      lumaDistance * 0.45 + edgeDistance * 0.2 + colorDistance * 0.35;
    const baseScore = combinedDistance * 100;
    const boostedScore =
      combinedDistance >= 0.38
        ? Math.max(baseScore, 80 + (combinedDistance - 0.38) * 40)
        : baseScore;
    const finalScore = Math.max(boostedScore, quickScore * 0.9);
    const score = Math.round(clamp(finalScore, 0, 100));

    writeCachedScore(cacheKey, score);
    return score;
  }

  writeCachedScore(cacheKey, quickScore);
  return quickScore;
}

export function getChangeLevel(score: number): ChangeLevel {
  if (score >= 55) {
    return 'high';
  }

  if (score >= 28) {
    return 'medium';
  }

  return 'low';
}
