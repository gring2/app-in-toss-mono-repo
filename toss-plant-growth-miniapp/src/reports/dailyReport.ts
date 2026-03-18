import {
  type PlantPhoto,
  getDateKeyFromDate,
  getDateKeyFromISO,
} from '../plants/store';
import {
  type ChangeLevel,
  computeChangeScore,
  getChangeLevel,
  isClearlyDifferentShot,
} from './scoring';

export type ComparisonLabel = string;
export const DEFAULT_COMPARISON_INTERVAL_DAYS = 7;

export type ComparisonTarget = {
  photo: PlantPhoto;
  dayDiff: number;
  label: string;
};

export type DailyReportPayload = {
  dateKey: string;
  isBaselineOnly: boolean;
  changeScore: number;
  deltaFromPrevious: number | null;
  changeLevel: ChangeLevel;
  summaryText: string;
  comparisonLabel: string | null;
};

export function getTodayDateKey() {
  return getDateKeyFromDate(new Date());
}

function getScoringDataUri(photo: PlantPhoto) {
  return photo.sourceDataUri ?? photo.dataUri;
}

function getTimestamp(isoDate: string) {
  const parsed = Date.parse(isoDate);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(year ?? 0, month ?? 0, day ?? 0);
}

function getDayDiff(fromDateKey: string, toDateKey: string) {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKey);

  if (from == null || to == null) {
    return Number.NaN;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / dayMs);
}

function getPreviousDayPhotos(photos: PlantPhoto[], currentPhoto: PlantPhoto) {
  const currentDateKey = getDateKeyFromISO(currentPhoto.capturedAt);

  return photos.filter((photo) => {
    if (photo.id === currentPhoto.id) {
      return false;
    }

    return getDateKeyFromISO(photo.capturedAt) !== currentDateKey;
  });
}

function getRelativeDayLabel(dayDiff: number) {
  return `${dayDiff}일 전`;
}

function getFallbackLabel(
  currentPhoto: PlantPhoto,
  previousPhoto: PlantPhoto,
): string {
  const currentDateKey = getDateKeyFromISO(currentPhoto.capturedAt);
  const previousDateKey = getDateKeyFromISO(previousPhoto.capturedAt);
  const dayDiff = getDayDiff(previousDateKey, currentDateKey);

  if (dayDiff === 1) {
    return '어제';
  }

  if (Number.isFinite(dayDiff) && dayDiff > 1) {
    return '지난 촬영';
  }

  return '지난 촬영';
}

export function selectComparisonTargetPhoto(
  photos: PlantPhoto[],
  currentPhoto: PlantPhoto,
  preferredDayDiff = DEFAULT_COMPARISON_INTERVAL_DAYS,
): ComparisonTarget | null {
  const currentDateKey = getDateKeyFromISO(currentPhoto.capturedAt);
  const previousDayPhotos = getPreviousDayPhotos(photos, currentPhoto);

  if (previousDayPhotos.length === 0) {
    return null;
  }

  const withDayDiff = previousDayPhotos
    .map((photo) => ({
      photo,
      dayDiff: getDayDiff(getDateKeyFromISO(photo.capturedAt), currentDateKey),
    }))
    .filter((entry) => Number.isFinite(entry.dayDiff) && entry.dayDiff > 0)
    .sort((a, b) => a.dayDiff - b.dayDiff);

  if (withDayDiff.length === 0) {
    const fallbackPhoto = previousDayPhotos[0];

    if (fallbackPhoto == null) {
      return null;
    }

    return {
      photo: fallbackPhoto,
      dayDiff: Number.NaN,
      label: '지난 촬영',
    };
  }

  const preferredCandidate = withDayDiff.find(
    (entry) => entry.dayDiff >= preferredDayDiff,
  );

  if (preferredCandidate != null) {
    return {
      photo: preferredCandidate.photo,
      dayDiff: preferredCandidate.dayDiff,
      label: getRelativeDayLabel(preferredCandidate.dayDiff),
    };
  }

  const fallbackCandidate = withDayDiff[0];

  if (fallbackCandidate == null) {
    return null;
  }

  return {
    photo: fallbackCandidate.photo,
    dayDiff: fallbackCandidate.dayDiff,
    label: getFallbackLabel(currentPhoto, fallbackCandidate.photo),
  };
}

function summaryByLevel(
  level: ChangeLevel,
  isBaselineOnly: boolean,
  comparisonLabel: string | null,
  score: number,
  sceneConfirmed: boolean,
) {
  if (isBaselineOnly) {
    return '오늘은 기준점을 만들었어요. 다음 촬영부터 비교 리포트가 열려요.';
  }

  const baseLabel = comparisonLabel ?? '지난 촬영';

  if (!sceneConfirmed && isClearlyDifferentShot(score)) {
    return `${baseLabel}과 장면 차이가 커요. 같은 위치에서 촬영하면 성장 비교가 더 정확해요.`;
  }

  switch (level) {
    case 'high':
      return `${baseLabel}보다 변화가 크게 감지됐어요.`;
    case 'medium':
      return `${baseLabel}보다 분명한 변화가 보여요.`;
    default:
      return `${baseLabel}와 비슷해요. 꾸준히 기록해보세요.`;
  }
}

export function buildDailyReportPayload({
  photos,
  sceneConfirmed = false,
}: {
  photos: PlantPhoto[];
  sceneConfirmed?: boolean;
}): DailyReportPayload | null {
  if (photos.length === 0) {
    return null;
  }

  const sorted = [...photos].sort(
    (a, b) => getTimestamp(b.capturedAt) - getTimestamp(a.capturedAt),
  );
  const currentPhoto = sorted[0];

  if (currentPhoto == null) {
    return null;
  }

  const comparisonTarget = selectComparisonTargetPhoto(sorted, currentPhoto);
  const previousPhoto = comparisonTarget?.photo ?? null;
  const isBaselineOnly = previousPhoto == null;
  const deltaFromPrevious = isBaselineOnly
    ? null
    : computeChangeScore(
        getScoringDataUri(previousPhoto),
        getScoringDataUri(currentPhoto),
      );
  const changeScore = deltaFromPrevious ?? 0;
  const changeLevel = getChangeLevel(changeScore);
  const comparisonLabel = comparisonTarget?.label ?? null;
  const summaryText = summaryByLevel(
    changeLevel,
    isBaselineOnly,
    comparisonLabel,
    changeScore,
    sceneConfirmed,
  );

  return {
    dateKey: getDateKeyFromISO(currentPhoto.capturedAt),
    isBaselineOnly,
    changeScore,
    deltaFromPrevious,
    changeLevel,
    summaryText,
    comparisonLabel,
  };
}
