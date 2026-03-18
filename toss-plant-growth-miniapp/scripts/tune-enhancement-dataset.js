/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { decode } = require('jpeg-js');

const ROOT = process.cwd();
const NORMAL_DIR = path.join(ROOT, 'normal_plant_pic');
const GOLDEN_DIR = path.join(ROOT, '식집사');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function listJpegFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .map((name) => path.join(dir, name))
    .filter(
      (filePath) =>
        /\.(jpe?g)$/i.test(filePath) && fs.statSync(filePath).isFile(),
    );
}

function decodeJpegFile(filePath) {
  const source = fs.readFileSync(filePath);

  try {
    const decoded = decode(source, { useTArray: true });

    if (
      decoded.width <= 0 ||
      decoded.height <= 0 ||
      decoded.data.length === 0
    ) {
      return null;
    }

    return {
      ...resizeNearest(
        new Uint8Array(decoded.data),
        decoded.width,
        decoded.height,
        320,
      ),
    };
  } catch {
    return null;
  }
}

function resizeNearest(data, width, height, targetMaxSide) {
  const maxSide = Math.max(width, height);

  if (maxSide <= targetMaxSide) {
    return { data, width, height };
  }

  const scale = targetMaxSide / maxSide;
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));
  const nextData = new Uint8Array(nextWidth * nextHeight * 4);

  for (let y = 0; y < nextHeight; y += 1) {
    for (let x = 0; x < nextWidth; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor(x / scale));
      const sourceY = Math.min(height - 1, Math.floor(y / scale));
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = (y * nextWidth + x) * 4;
      nextData[targetIndex] = data[sourceIndex] ?? 0;
      nextData[targetIndex + 1] = data[sourceIndex + 1] ?? 0;
      nextData[targetIndex + 2] = data[sourceIndex + 2] ?? 0;
      nextData[targetIndex + 3] = data[sourceIndex + 3] ?? 255;
    }
  }

  return {
    data: nextData,
    width: nextWidth,
    height: nextHeight,
  };
}

function computeMetrics(image) {
  const { data, width, height } = image;

  if (width < 3 || height < 3) {
    return {
      detail: 0,
      contrast: 0,
      saturation: 0,
      green: 0,
    };
  }

  const luma = new Float32Array(width * height);
  let saturationSum = 0;
  let greenSum = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = data[index] ?? 0;
      const green = data[index + 1] ?? 0;
      const blue = data[index + 2] ?? 0;
      const max = Math.max(red, green, blue) / 255;
      const min = Math.min(red, green, blue) / 255;
      luma[y * width + x] =
        (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      saturationSum += max === 0 ? 0 : (max - min) / max;
      greenSum += clamp(((green - red) + (green - blue)) / 255, 0, 1);
    }
  }

  let detailSum = 0;
  let detailCount = 0;
  let lumaSum = 0;
  let lumaSqSum = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const center = luma[index] ?? 0;
      const right = luma[index + 1] ?? center;
      const left = luma[index - 1] ?? center;
      const up = luma[index - width] ?? center;
      const down = luma[index + width] ?? center;
      const dx = right - left;
      const dy = down - up;

      detailSum += Math.sqrt(dx * dx + dy * dy);
      detailCount += 1;
      lumaSum += center;
      lumaSqSum += center * center;
    }
  }

  const contrast =
    detailCount === 0
      ? 0
      : Math.sqrt(
          Math.max(lumaSqSum / detailCount - (lumaSum / detailCount) ** 2, 0),
        );

  return {
    detail: detailCount === 0 ? 0 : detailSum / detailCount,
    contrast,
    saturation: saturationSum / (width * height),
    green: greenSum / (width * height),
  };
}

function computeMeanMetrics(images) {
  const total = {
    detail: 0,
    contrast: 0,
    saturation: 0,
    green: 0,
  };

  if (images.length === 0) {
    return total;
  }

  images.forEach((image) => {
    const metrics = computeMetrics(image);
    total.detail += metrics.detail;
    total.contrast += metrics.contrast;
    total.saturation += metrics.saturation;
    total.green += metrics.green;
  });

  return {
    detail: total.detail / images.length,
    contrast: total.contrast / images.length,
    saturation: total.saturation / images.length,
    green: total.green / images.length,
  };
}

function isPlantLikePixel(red, green, blue) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return green > red * 1.03 && green > blue * 1.02 && max - min >= 8;
}

function buildLut(gamma) {
  const lut = new Uint8Array(256);

  for (let value = 0; value < 256; value += 1) {
    const normalized = value / 255;
    lut[value] = Math.round(clamp(normalized ** gamma * 255, 0, 255));
  }

  return lut;
}

function buildLumaMap(rgba, width, height) {
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

function applyGreyWorldBalance(rgba, profile) {
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
  const scaleR = clamp(gray / Math.max(avgR, 1), 0.88, 1.2);
  const scaleG = clamp(gray / Math.max(avgG, 1), 0.9, 1.12);
  const scaleB = clamp(gray / Math.max(avgB, 1), 0.88, 1.2);

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

function applyLocalContrastBoost(rgba, width, height, strength, gainScale = 1) {
  if (width < 3 || height < 3) {
    return;
  }

  const luma = buildLumaMap(rgba, width, height);
  const baseGain = (22 + strength * 20) * gainScale;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const centerIndex = y * width + x;
      let sum = 0;

      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          sum += luma[(y + oy) * width + (x + ox)] ?? 0;
        }
      }

      const localMean = sum / 9;
      const localDetail = (luma[centerIndex] ?? localMean) - localMean;
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

function applyGammaCorrection(rgba, gamma) {
  const lut = buildLut(gamma);

  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = lut[rgba[index] ?? 0] ?? (rgba[index] ?? 0);
    rgba[index + 1] = lut[rgba[index + 1] ?? 0] ?? (rgba[index + 1] ?? 0);
    rgba[index + 2] = lut[rgba[index + 2] ?? 0] ?? (rgba[index + 2] ?? 0);
  }
}

function applyGreenDetailBoost(rgba, profileStrength) {
  const greenGain = 1.08 + profileStrength * 0.1;
  const redCompensate = 0.985 - profileStrength * 0.02;
  const blueCompensate = 0.982 - profileStrength * 0.02;

  for (let index = 0; index < rgba.length; index += 4) {
    const red = rgba[index] ?? 0;
    const green = rgba[index + 1] ?? 0;
    const blue = rgba[index + 2] ?? 0;

    if (!isPlantLikePixel(red, green, blue)) {
      continue;
    }

    rgba[index] = Math.round(clamp(red * redCompensate, 0, 255));
    rgba[index + 1] = Math.round(clamp(green * greenGain, 0, 255));
    rgba[index + 2] = Math.round(clamp(blue * blueCompensate, 0, 255));
  }
}

function applySelectiveVibrance(rgba, plantBoost, backgroundBoost) {
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

function applyUnsharpMask(rgba, width, height, amount, detailStrength) {
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
      const maxBoost = 16 + detailStrength * 10;
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

function applyHighlightCompression(rgba, profileStrength, compressionStrength = 1) {
  const highlightStart = 206 - profileStrength * 18 * compressionStrength;

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

function enhanceCandidate(image, candidate) {
  const rgba = new Uint8Array(image.data);
  const contrastStrength =
    candidate.contrastMul + candidate.profile * candidate.contrastAdd;
  const detailStrength =
    candidate.detailMul + candidate.profile * candidate.detailAdd;

  applyGreyWorldBalance(rgba, candidate);
  applyLocalContrastBoost(
    rgba,
    image.width,
    image.height,
    contrastStrength,
    candidate.localGainScale,
  );
  applyGammaCorrection(rgba, candidate.gamma);
  applyGreenDetailBoost(rgba, candidate.profile);
  applySelectiveVibrance(
    rgba,
    candidate.plantVibrance,
    candidate.backgroundVibrance,
  );
  applyUnsharpMask(
    rgba,
    image.width,
    image.height,
    candidate.sharpen,
    detailStrength,
  );
  applyHighlightCompression(
    rgba,
    candidate.profile,
    candidate.highlightCompression,
  );

  return {
    data: rgba,
    width: image.width,
    height: image.height,
  };
}

function run() {
  const normalFiles = listJpegFiles(NORMAL_DIR);
  const goldenFiles = listJpegFiles(GOLDEN_DIR);
  const normalImages = normalFiles.map(decodeJpegFile).filter(Boolean);
  const goldenImages = goldenFiles.map(decodeJpegFile).filter(Boolean);

  console.log(
    '[dataset] normal:',
    normalFiles.length,
    'jpeg files,',
    normalImages.length,
    'decoded',
  );
  console.log(
    '[dataset] golden:',
    goldenFiles.length,
    'jpeg files,',
    goldenImages.length,
    'decoded',
  );

  if (normalImages.length === 0 || goldenImages.length === 0) {
    console.error(
      '[dataset] Need both sets decoded from jpeg files. (HEIC is skipped)',
    );
    process.exit(1);
  }

  const normalMean = computeMeanMetrics(normalImages);
  const goldenMean = computeMeanMetrics(goldenImages);

  const candidates = [];

  [0.72, 0.9, 1.08].forEach((profile) => {
    [0.95, 1.1, 1.25].forEach((sharpen) => {
      [0.92, 0.96, 1].forEach((gamma) => {
        [1.0, 1.25, 1.4].forEach((localGainScale) => {
          [0.28, 0.45, 0.6].forEach((plantVibrance) => {
            [0.04, 0.08].forEach((backgroundVibrance) => {
              [0.5, 0.7, 0.9].forEach((highlightCompression) => {
                candidates.push({
                  profile,
                  sharpen,
                  gamma,
                  localGainScale,
                  plantVibrance,
                  backgroundVibrance,
                  highlightCompression,
                  contrastMul: 0.78,
                  contrastAdd: 0.42,
                  detailMul: 0.68,
                  detailAdd: 0.44,
                });
              });
            });
          });
        });
      });
    });
  });

  let best = null;

  candidates.forEach((candidate) => {
    const enhancedImages = normalImages.map((image) =>
      enhanceCandidate(image, candidate),
    );
    const enhancedMean = computeMeanMetrics(enhancedImages);
    const detailGain =
      (enhancedMean.detail - normalMean.detail) / Math.max(normalMean.detail, 1e-6);
    const contrastGain =
      (enhancedMean.contrast - normalMean.contrast) /
      Math.max(normalMean.contrast, 1e-6);
    const saturationGain =
      (enhancedMean.saturation - normalMean.saturation) /
      Math.max(normalMean.saturation, 1e-6);
    const greenGain =
      (enhancedMean.green - normalMean.green) /
      Math.max(normalMean.green, 1e-6);

    const loss =
      Math.abs(
        (enhancedMean.detail - goldenMean.detail) /
          Math.max(goldenMean.detail, 1e-6),
      ) *
        0.45 +
      Math.abs(
        (enhancedMean.contrast - goldenMean.contrast) /
          Math.max(goldenMean.contrast, 1e-6),
      ) *
        0.25 +
      Math.abs(
        (enhancedMean.saturation - goldenMean.saturation) /
          Math.max(goldenMean.saturation, 1e-6),
      ) *
        0.2 +
      Math.abs(
        (enhancedMean.green - goldenMean.green) / Math.max(goldenMean.green, 1e-6),
      ) *
        0.1 +
      (detailGain < 0.12 ? (0.12 - detailGain) * 6 : 0) +
      (contrastGain < -0.08 ? (-0.08 - contrastGain) * 8 : 0) +
      (saturationGain < 0.1 ? (0.1 - saturationGain) * 8 : 0) +
      (greenGain < 0.2 ? (0.2 - greenGain) * 2 : 0) +
      (enhancedMean.saturation > normalMean.saturation * 1.5
        ? (enhancedMean.saturation - normalMean.saturation * 1.5) * 5
        : 0);

    if (best == null || loss < best.loss) {
      best = {
        candidate,
        loss,
        detailGain,
        contrastGain,
        saturationGain,
        greenGain,
        enhancedMean,
      };
    }
  });

  console.log('[metrics] normal mean:', normalMean);
  console.log('[metrics] golden mean:', goldenMean);
  console.log('[best candidate]:', JSON.stringify(best, null, 2));
}

run();
