export type CameraExperiencePresetId = 'diary' | 'detail' | 'whole';

export type CameraExperiencePreset = {
  id: CameraExperiencePresetId;
  title: string;
  subtitle: string;
  promise: string;
  recommended: boolean;
  flowSummary: string;
  framingTips: [string, string, string];
  afterCaptureMessage: string;
  nextStepBody: string;
  tomorrowCue: string;
  processingProfile: 'none' | 'light';
  accentColor: string;
  filterLabel: string;
  filterDescription: string;
  framingBadge: string;
  overlayHint: string;
  captureCta: string;
  processingNote: string;
};

export const CAMERA_PRESETS: CameraExperiencePreset[] = [
  {
    id: 'diary',
    title: '오늘 기록',
    subtitle: '매일 보는 식물 상태를 빠르게 남겨요',
    promise: '가볍고 빠르게, 실제 모습 그대로 기록해요.',
    recommended: true,
    flowSummary: '추천 시작 · 가장 빠르게 오늘 상태를 남기는 기본 모드예요.',
    framingTips: [
      '식물 전체가 화면 안에 들어오게',
      '배경은 최대한 단순하게',
      '촬영 직후 바로 기록 확인',
    ],
    afterCaptureMessage: '오늘 기록 톤으로 빠르게 정리해 보여드려요.',
    nextStepBody: '결과를 확인하고 오늘 기록은 여기서 끝내도 좋아요.',
    tomorrowCue:
      '내일 비슷한 자리에서 다시 찍으면 식물 상태를 더 쉽게 떠올릴 수 있어요.',
    processingProfile: 'none',
    accentColor: '#16A34A',
    filterLabel: '내추럴 그린',
    filterDescription:
      '색을 과하게 올리지 않고 오늘 식물의 실제 톤과 구도를 자연스럽게 남겨요.',
    framingBadge: '전체 실루엣 + 화분선',
    overlayHint:
      '식물 머리와 화분 바닥이 프레임 안에 들어오도록 맞추면 오늘 기록으로 보기 좋아요.',
    captureCta: '오늘 기록 모드로 촬영하기',
    processingNote:
      '후처리는 최소화하고 기존 품질 판별 기준으로 선명도와 식물 비중만 확인해요.',
  },
  {
    id: 'detail',
    title: '새잎 디테일',
    subtitle: '작은 잎맥과 색 변화를 더 또렷하게 보려는 모드예요',
    promise: '강한 보정 대신, 디테일만 살짝 더 보이게 정리해요.',
    recommended: false,
    flowSummary:
      '디테일 집중 · 새순, 잎맥, 작은 색 차이를 기록하려는 모드예요.',
    framingTips: [
      '잎이나 새순을 화면 중앙에 크게',
      '손을 1초 멈추고 촬영',
      '촬영 후 은은한 디테일 톤 적용',
    ],
    afterCaptureMessage: '새잎 디테일 톤으로 가볍게 정리해 보여드려요.',
    nextStepBody:
      '잎맥이나 새순이 잘 보이는지 먼저 확인하고, 필요하면 같은 자리에서 한 번 더 찍어보세요.',
    tomorrowCue:
      '내일도 같은 부위를 다시 찍으면 작은 디테일 변화를 더 쉽게 기억할 수 있어요.',
    processingProfile: 'light',
    accentColor: '#0F766E',
    filterLabel: '리프 디테일',
    filterDescription:
      '잎맥과 새순 주변 디테일을 가볍게 살려서 식물 사진이 더 또렷하게 보이게 해요.',
    framingBadge: '중앙 잎맥 + 새순 확대',
    overlayHint:
      '새잎이나 잎맥이 가운데 가이드 안에 크게 들어오면 기존 품질 점수와 디테일 강화가 가장 안정적이에요.',
    captureCta: '새잎 디테일 모드로 촬영하기',
    processingNote:
      '기존 식물 전용 품질 점수와 동일한 기준으로 분석한 뒤 가벼운 디테일 강화만 적용해요.',
  },
  {
    id: 'whole',
    title: '전체 실루엣',
    subtitle: '화분과 수형을 한눈에 남기는 모드예요',
    promise: '전체 비율과 분위기를 그대로 보존해요.',
    recommended: false,
    flowSummary: '전체 보기 · 화분, 줄기, 수형을 자연스럽게 남기는 모드예요.',
    framingTips: [
      '화분 바닥선까지 같이 담기',
      '식물 머리가 잘리지 않게',
      '실루엣 중심으로 자연스럽게 저장',
    ],
    afterCaptureMessage: '전체 실루엣 톤으로 자연스럽게 보여드려요.',
    nextStepBody:
      '식물의 비율과 실루엣이 자연스러운지 확인한 뒤 오늘 기록으로 저장하세요.',
    tomorrowCue:
      '다음 기록도 비슷한 거리에서 찍으면 전체 흐름을 훨씬 보기 쉬워져요.',
    processingProfile: 'none',
    accentColor: '#4F46E5',
    filterLabel: '실루엣 밸런스',
    filterDescription:
      '화분과 줄기, 전체 수형이 잘리지 않도록 구도를 먼저 잡아주는 기록용 톤이에요.',
    framingBadge: '상단 여백 + 하단 화분선',
    overlayHint:
      '식물 머리 위 여백과 화분 바닥선이 함께 보이면 내일 같은 거리에서 다시 찍기 쉬워져요.',
    captureCta: '전체 실루엣 모드로 촬영하기',
    processingNote:
      '자연스러운 결과를 우선하고 기존 품질 판별 점수로 배경 과다·구도 이탈만 먼저 체크해요.',
  },
];

export const DEFAULT_CAMERA_PRESET_ID: CameraExperiencePresetId = 'diary';

export function getCameraPresetById(
  id: CameraExperiencePresetId,
): CameraExperiencePreset {
  return (
    CAMERA_PRESETS.find((preset) => preset.id === id) ??
    CAMERA_PRESETS.find((preset) => preset.id === DEFAULT_CAMERA_PRESET_ID) ?? {
      id: 'diary',
      title: '오늘 기록',
      subtitle: '매일 보는 식물 상태를 빠르게 남겨요',
      promise: '가볍고 빠르게, 실제 모습 그대로 기록해요.',
      recommended: true,
      flowSummary: '추천 시작 · 가장 빠르게 오늘 상태를 남기는 기본 모드예요.',
      framingTips: [
        '식물 전체가 화면 안에 들어오게',
        '배경은 최대한 단순하게',
        '촬영 직후 바로 기록 확인',
      ],
      afterCaptureMessage: '오늘 기록 톤으로 빠르게 정리해 보여드려요.',
      nextStepBody: '결과를 확인하고 오늘 기록은 여기서 끝내도 좋아요.',
      tomorrowCue:
        '내일 비슷한 자리에서 다시 찍으면 식물 상태를 더 쉽게 떠올릴 수 있어요.',
      processingProfile: 'none',
      accentColor: '#16A34A',
      filterLabel: '내추럴 그린',
      filterDescription:
        '색을 과하게 올리지 않고 오늘 식물의 실제 톤과 구도를 자연스럽게 남겨요.',
      framingBadge: '전체 실루엣 + 화분선',
      overlayHint:
        '식물 머리와 화분 바닥이 프레임 안에 들어오도록 맞추면 오늘 기록으로 보기 좋아요.',
      captureCta: '오늘 기록 모드로 촬영하기',
      processingNote:
        '후처리는 최소화하고 기존 품질 판별 기준으로 선명도와 식물 비중만 확인해요.',
    }
  );
}
