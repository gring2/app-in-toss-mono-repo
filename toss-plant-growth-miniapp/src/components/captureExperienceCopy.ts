import type { CameraExperiencePreset } from '../camera/presets';
import type {
  CaptureQualityReason,
  CaptureQualityRecommendation,
} from '../camera/quality';

export type CameraPermissionState =
  | 'checking'
  | 'allowed'
  | 'denied'
  | 'notDetermined';

export function getCameraPermissionCopy(status: CameraPermissionState) {
  switch (status) {
    case 'checking':
      return {
        title: '카메라 권한을 확인하는 중이에요',
        body: '토스 카메라 연결 상태를 먼저 확인하고 있어요. 잠시만 기다려주세요.',
        actionLabel: '확인 중...',
      };
    case 'allowed':
      return {
        title: '식물 카메라 준비 완료',
        body: '가이드 프레임을 확인한 뒤 바로 촬영을 시작할 수 있어요.',
        actionLabel: '촬영 시작하기',
      };
    case 'denied':
      return {
        title: '카메라 권한이 필요해요',
        body: '식물 사진을 남기려면 카메라 권한을 허용해주세요. 권한을 허용하면 지금 디자인 그대로 촬영 흐름을 이어갈 수 있어요.',
        actionLabel: '권한 다시 요청하기',
      };
    default:
      return {
        title: '촬영 전에 권한만 확인할게요',
        body: '처음 한 번만 카메라 권한을 확인하면, 이후에는 오늘 기록 촬영을 더 빠르게 이어갈 수 있어요.',
        actionLabel: '권한 확인하고 시작하기',
      };
  }
}

export function getCaptureButtonLabel({
  permissionStatus,
  isRunning,
  preset,
}: {
  permissionStatus: CameraPermissionState;
  isRunning: boolean;
  preset: CameraExperiencePreset;
}) {
  if (isRunning) {
    return '처리 중...';
  }

  if (permissionStatus !== 'allowed') {
    return getCameraPermissionCopy(permissionStatus).actionLabel;
  }

  return preset.captureCta;
}

export function getRecommendationLabel(
  recommendation: CaptureQualityRecommendation,
) {
  switch (recommendation) {
    case 'good':
      return '지금 사진으로 기록하기 좋아요';
    case 'retake_recommended':
      return '한 번 더 찍으면 더 좋아져요';
    case 'retake_strongly_recommended':
      return '다시 촬영을 강하게 추천해요';
    default:
      return '촬영 가이드를 다시 확인해주세요';
  }
}

export function formatQualityReasons(reasons: CaptureQualityReason[]) {
  if (reasons.length === 0) {
    return '큰 품질 경고 없이 안정적으로 인식됐어요.';
  }

  const labels = reasons.map((reason) => {
    switch (reason) {
      case 'blurry':
        return '조금 흐림';
      case 'shaky':
        return '손떨림';
      case 'low_light':
        return '어두움';
      case 'overexposed':
        return '빛이 강함';
      case 'plant_too_small':
        return '식물이 작게 잡힘';
      default:
        return reason;
    }
  });

  return labels.join(' · ');
}

export function getPresetFilterSummary(preset: CameraExperiencePreset) {
  return `${preset.filterLabel} · ${preset.filterDescription}`;
}
