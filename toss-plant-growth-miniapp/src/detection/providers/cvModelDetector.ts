type CvModelDetectOk = {
  status: 'ok';
  confidence: number;
};

type CvModelDetectUnavailable = {
  status: 'unavailable';
  reason: 'module_not_configured' | 'model_not_loaded' | 'unsupported_runtime';
};

type CvModelDetectError = {
  status: 'error';
  error: unknown;
};

export type CvModelDetectResult =
  | CvModelDetectOk
  | CvModelDetectUnavailable
  | CvModelDetectError;

export async function detectWithCvModel(): Promise<CvModelDetectResult> {
  return {
    status: 'unavailable',
    reason: 'module_not_configured',
  };
}
