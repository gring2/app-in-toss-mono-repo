import { toByteArray } from 'base64-js';

const DATA_URI_PATTERN = /^data:([^;]+);base64,(.+)$/i;

function decodeBase64Prefix(payload: string, byteCount = 24) {
  const normalized = payload.replace(/[^A-Za-z0-9+/=]/g, '');

  if (normalized.length === 0) {
    return new Uint8Array(0);
  }

  const charsNeeded = Math.max(8, Math.ceil(byteCount / 3) * 4);
  const prefix = normalized.slice(0, charsNeeded);
  const padded = prefix.padEnd(Math.ceil(prefix.length / 4) * 4, '=');

  try {
    return toByteArray(padded);
  } catch {
    return new Uint8Array(0);
  }
}

export function inferCapturedImageMimeType(
  rawDataUri: string,
  fallbackMimeType = 'image/jpeg',
) {
  const trimmed = rawDataUri.trim();
  const matched = trimmed.match(DATA_URI_PATTERN);

  if (matched?.[1] != null) {
    return matched[1];
  }

  const bytes = decodeBase64Prefix(trimmed, 24);

  if (bytes.length >= 3) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }

    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'image/png';
    }

    if (
      bytes.length >= 12 &&
      String.fromCharCode(
        bytes[0] ?? 0,
        bytes[1] ?? 0,
        bytes[2] ?? 0,
        bytes[3] ?? 0,
      ) === 'RIFF' &&
      String.fromCharCode(
        bytes[8] ?? 0,
        bytes[9] ?? 0,
        bytes[10] ?? 0,
        bytes[11] ?? 0,
      ) === 'WEBP'
    ) {
      return 'image/webp';
    }
  }

  if (bytes.length >= 12) {
    const brand = String.fromCharCode(
      bytes[8] ?? 0,
      bytes[9] ?? 0,
      bytes[10] ?? 0,
      bytes[11] ?? 0,
    ).toLowerCase();

    if (brand.startsWith('heic') || brand.startsWith('heix')) {
      return 'image/heic';
    }

    if (brand.startsWith('heif') || brand.startsWith('mif1')) {
      return 'image/heif';
    }

    if (brand.startsWith('avif')) {
      return 'image/avif';
    }
  }

  return fallbackMimeType;
}

export function normalizeCapturedImage(
  rawDataUri: string,
  fallbackMimeType = 'image/jpeg',
) {
  const trimmed = rawDataUri.trim();
  const matched = trimmed.match(DATA_URI_PATTERN);

  if (matched == null) {
    return {
      dataUri: trimmed,
      mimeType: inferCapturedImageMimeType(trimmed, fallbackMimeType),
    };
  }

  return {
    dataUri: matched[2] ?? trimmed,
    mimeType:
      matched[1] ?? inferCapturedImageMimeType(trimmed, fallbackMimeType),
  };
}

export function toDisplayImageUri(dataUri: string, mimeType: string) {
  if (dataUri.startsWith('data:')) {
    return dataUri;
  }

  return `data:${mimeType};base64,${dataUri}`;
}
