const DATA_URI_PATTERN = /^data:([^;]+);base64,(.+)$/i;

export function normalizeCapturedImage(
  rawDataUri: string,
  fallbackMimeType = 'image/jpeg',
) {
  const trimmed = rawDataUri.trim();
  const matched = trimmed.match(DATA_URI_PATTERN);

  if (matched == null) {
    return {
      dataUri: trimmed,
      mimeType: fallbackMimeType,
    };
  }

  return {
    dataUri: matched[2] ?? trimmed,
    mimeType: matched[1] ?? fallbackMimeType,
  };
}

export function toDisplayImageUri(dataUri: string, mimeType: string) {
  if (dataUri.startsWith('data:')) {
    return dataUri;
  }

  return `data:${mimeType};base64,${dataUri}`;
}
