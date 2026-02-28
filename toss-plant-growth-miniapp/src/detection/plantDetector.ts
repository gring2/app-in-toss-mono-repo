import {
  type CvModelDetectResult,
  detectWithCvModel,
} from './providers/cvModelDetector';
import {
  type HeuristicPlantDetectResult,
  detectPlantByHeuristic,
} from './providers/heuristicPlantDetector';

const CV_PASS_THRESHOLD = 0.7;
const CV_SUSPECT_THRESHOLD = 0.45;
const HEURISTIC_PASS_THRESHOLD = 0.56;
const HEURISTIC_SUSPECT_THRESHOLD = 0.28;

export type PlantDetectionMode = 'cv_model' | 'heuristic';
export type PlantDetectionReason =
  | 'ok'
  | 'suspected_non_plant'
  | 'model_unavailable'
  | 'error';
export type PlantDetectionDecision = 'pass' | 'suspect' | 'reject';

export type PlantDetectionResult = {
  isPlantLikely: boolean;
  confidence: number;
  mode: PlantDetectionMode;
  reason: PlantDetectionReason;
  decision: PlantDetectionDecision;
  debug?: Record<string, number | string>;
};

function classifyByThreshold(
  confidence: number,
  mode: PlantDetectionMode,
): PlantDetectionDecision {
  const passThreshold =
    mode === 'cv_model' ? CV_PASS_THRESHOLD : HEURISTIC_PASS_THRESHOLD;
  const suspectThreshold =
    mode === 'cv_model' ? CV_SUSPECT_THRESHOLD : HEURISTIC_SUSPECT_THRESHOLD;

  if (confidence >= passThreshold) {
    return 'pass';
  }

  if (confidence >= suspectThreshold) {
    return 'suspect';
  }

  return 'reject';
}

function toResult({
  confidence,
  mode,
  reason,
  debug,
}: {
  confidence: number;
  mode: PlantDetectionMode;
  reason: PlantDetectionReason;
  debug?: Record<string, number | string>;
}): PlantDetectionResult {
  const decision = classifyByThreshold(confidence, mode);

  return {
    isPlantLikely: decision === 'pass',
    confidence,
    mode,
    reason: decision === 'pass' ? 'ok' : reason,
    decision,
    debug,
  };
}

function fromCvResult(
  cvResult: CvModelDetectResult,
): PlantDetectionResult | null {
  if (cvResult.status === 'ok') {
    return toResult({
      confidence: cvResult.confidence,
      mode: 'cv_model',
      reason: 'suspected_non_plant',
    });
  }

  if (cvResult.status === 'unavailable') {
    return null;
  }

  console.warn('[PlantDetector] CV model detection failed:', cvResult.error);
  return null;
}

function fromHeuristic(
  heuristicResult: HeuristicPlantDetectResult,
  reason: PlantDetectionReason,
) {
  return toResult({
    confidence: heuristicResult.confidence,
    mode: 'heuristic',
    reason,
    debug: {
      ...heuristicResult.debug,
    },
  });
}

export async function detectPlantFromDataUri({
  dataUri,
  mimeType,
}: {
  dataUri: string;
  mimeType?: string;
}) {
  try {
    const cvResult = await detectWithCvModel();
    const cvDetection = fromCvResult(cvResult);

    if (cvDetection != null) {
      return cvDetection;
    }

    const heuristicResult = detectPlantByHeuristic(dataUri);
    return {
      ...fromHeuristic(heuristicResult, 'model_unavailable'),
      debug: {
        ...heuristicResult.debug,
        mimeType: mimeType ?? '',
      },
    };
  } catch (error) {
    console.warn('[PlantDetector] Failed to run detector:', error);

    const heuristicResult = detectPlantByHeuristic(dataUri);
    return {
      ...fromHeuristic(heuristicResult, 'error'),
      debug: {
        ...heuristicResult.debug,
        mimeType: mimeType ?? '',
      },
    };
  }
}
