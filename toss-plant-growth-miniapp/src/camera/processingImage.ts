export type PreparedProcessingImage = {
  previewImage: {
    dataUri: string;
    mimeType: string;
  };
  processingImage: {
    dataUri: string;
    mimeType: string;
  } | null;
  normalized: boolean;
  sourceMimeType: string;
  normalizationReason:
    | 'already_jpeg'
    | 'heic_fast_fallback'
    | 'unsupported_format'
    | 'unknown_format';
};

function buildUnsupportedResult(
  dataUri: string,
  mimeType: string,
  normalizationReason:
    | 'heic_fast_fallback'
    | 'unsupported_format'
    | 'unknown_format',
): PreparedProcessingImage {
  return {
    previewImage: {
      dataUri,
      mimeType,
    },
    processingImage: null,
    normalized: false,
    sourceMimeType: mimeType,
    normalizationReason,
  };
}

export async function prepareImageForProcessing({
  dataUri,
  mimeType,
}: {
  dataUri: string;
  mimeType: string;
}): Promise<PreparedProcessingImage> {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  const resolvedMimeType =
    normalizedMimeType.length > 0
      ? normalizedMimeType
      : 'application/octet-stream';

  // Preserve the supported JPEG path exactly as captured so the preview and any
  // saved source image keep the original quality characteristics.
  if (resolvedMimeType === 'image/jpeg' || resolvedMimeType === 'image/jpg') {
    return {
      previewImage: {
        dataUri,
        mimeType: resolvedMimeType,
      },
      processingImage: {
        dataUri,
        mimeType: resolvedMimeType,
      },
      normalized: false,
      sourceMimeType: resolvedMimeType,
      normalizationReason: 'already_jpeg',
    };
  }

  if (resolvedMimeType === 'image/heic' || resolvedMimeType === 'image/heif') {
    return buildUnsupportedResult(
      dataUri,
      resolvedMimeType,
      'heic_fast_fallback',
    );
  }

  return buildUnsupportedResult(
    dataUri,
    resolvedMimeType,
    normalizedMimeType.length === 0 ? 'unknown_format' : 'unsupported_format',
  );
}
