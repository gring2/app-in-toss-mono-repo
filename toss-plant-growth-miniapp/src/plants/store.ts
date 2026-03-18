import { Storage } from '@apps-in-toss/native-modules';

export type PlantProfile = {
  id: string;
  name: string;
  createdAt: string;
  baselinePhotoId: string;
  slotKey: string;
};

export type PlantPhoto = {
  id: string;
  plantId: string;
  capturedAt: string;
  dataUri: string;
  mimeType: string;
  isBaseline: boolean;
  sourceDataUri?: string;
  sourceMimeType?: string;
  enhancementVersion?: string;
  enhancementStatus?: 'enhanced' | 'raw_fallback';
};

export type ReportBadge = 'weekly-7';

export type DailyReportState = {
  lastUnlockedDateKey: string | null;
  lastUnlockDateKey: string | null;
  streakCount: number;
  badges: ReportBadge[];
  confirmedSceneKeys: string[];
};

export type PlantState = {
  plants: PlantProfile[];
  photos: PlantPhoto[];
  activePlantId: string | null;
  unlockedPlantSlots: number;
  reportState: DailyReportState;
};

type PlantProfileLegacy = Omit<PlantProfile, 'slotKey'>;

type PlantStateV3Legacy = Omit<PlantState, 'plants'> & {
  plants: PlantProfileLegacy[];
};

export type PlantStateV2 = {
  plants: PlantProfileLegacy[];
  photos: PlantPhoto[];
  activePlantId: string | null;
  unlockedPlantSlots: number;
};

export type LegacyPlantState = {
  profile: PlantProfileLegacy | null;
  photos: PlantPhoto[];
};

export type ComparePair = {
  baseline: PlantPhoto;
  latest: PlantPhoto;
};

export type CreatePlantBaselineResult =
  | { ok: true; plantId: string; slotKey: string }
  | { ok: false; reason: 'slot_limit_reached' };

export type UnlockTodayReportResult = 'alreadyUnlocked' | 'unlocked';
export type UpdatePlantNameResult = 'ok' | 'empty_name' | 'not_found';
export type DeletePlantSlotResult = 'ok' | 'not_found';
export type AddDailyPhotoResult = {
  state: PlantState;
  didOverwriteSameDay: boolean;
  slotKey: string;
};

type Listener = (state: PlantState) => void;

const STORAGE_KEY = 'plant-growth-v4';
const LEGACY_STORAGE_KEY_V3 = 'plant-growth-v3';
const LEGACY_STORAGE_KEY_V2 = 'plant-growth-v2';
const LEGACY_STORAGE_KEY_V1 = 'plant-growth-v1';
const DEFAULT_PLANT_NAME = '나의 식물';
const MAX_CONFIRMED_SCENE_KEYS = 200;
const DEFAULT_REPORT_STATE: DailyReportState = {
  lastUnlockedDateKey: null,
  lastUnlockDateKey: null,
  streakCount: 0,
  badges: [],
  confirmedSceneKeys: [],
};
const INITIAL_STATE: PlantState = {
  plants: [],
  photos: [],
  activePlantId: null,
  unlockedPlantSlots: 1,
  reportState: DEFAULT_REPORT_STATE,
};

let stateCache: PlantState = cloneState(INITIAL_STATE);
let hydrated = false;
const listeners = new Set<Listener>();

function cloneReportState(reportState: DailyReportState): DailyReportState {
  return {
    lastUnlockedDateKey: reportState.lastUnlockedDateKey,
    lastUnlockDateKey: reportState.lastUnlockDateKey,
    streakCount: reportState.streakCount,
    badges: [...reportState.badges],
    confirmedSceneKeys: [...(reportState.confirmedSceneKeys ?? [])],
  };
}

function cloneState(state: PlantState): PlantState {
  return {
    plants: state.plants.map((plant) => ({ ...plant })),
    photos: state.photos.map((photo) => ({ ...photo })),
    activePlantId: state.activePlantId,
    unlockedPlantSlots: state.unlockedPlantSlots,
    reportState: cloneReportState(state.reportState),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function buildSlotKey(slotNumber: number) {
  return `slot-${slotNumber}`;
}

function parseSlotNumber(slotKey: string) {
  const match = /^slot-(\d+)$/.exec(slotKey);

  if (match == null) {
    return null;
  }

  const parsed = Number(match[1]);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function isPlantProfileLegacy(value: unknown): value is PlantProfileLegacy {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.baselinePhotoId === 'string'
  );
}

function isPlantProfile(value: unknown): value is PlantProfile {
  if (!isPlantProfileLegacy(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.slotKey === 'string';
}

function isPlantPhoto(value: unknown): value is PlantPhoto {
  if (!isObject(value)) {
    return false;
  }

  const sourceDataUri = value.sourceDataUri;
  const sourceMimeType = value.sourceMimeType;
  const enhancementVersion = value.enhancementVersion;
  const enhancementStatus = value.enhancementStatus;

  return (
    typeof value.id === 'string' &&
    typeof value.plantId === 'string' &&
    typeof value.capturedAt === 'string' &&
    typeof value.dataUri === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.isBaseline === 'boolean' &&
    (sourceDataUri == null || typeof sourceDataUri === 'string') &&
    (sourceMimeType == null || typeof sourceMimeType === 'string') &&
    (enhancementVersion == null || typeof enhancementVersion === 'string') &&
    (enhancementStatus == null ||
      enhancementStatus === 'enhanced' ||
      enhancementStatus === 'raw_fallback')
  );
}

function isReportBadge(value: unknown): value is ReportBadge {
  return value === 'weekly-7';
}

function isDailyReportState(value: unknown): value is DailyReportState {
  if (!isObject(value)) {
    return false;
  }

  return (
    (value.lastUnlockedDateKey == null ||
      typeof value.lastUnlockedDateKey === 'string') &&
    (value.lastUnlockDateKey == null ||
      typeof value.lastUnlockDateKey === 'string') &&
    typeof value.streakCount === 'number' &&
    Number.isFinite(value.streakCount) &&
    value.streakCount >= 0 &&
    Array.isArray(value.badges) &&
    value.badges.every(isReportBadge) &&
    (value.confirmedSceneKeys == null ||
      (Array.isArray(value.confirmedSceneKeys) &&
        value.confirmedSceneKeys.every(
          (sceneKey) => typeof sceneKey === 'string',
        )))
  );
}

function assignSlotKeys(
  plants: PlantProfileLegacy[],
  unlockedPlantSlots: number,
) {
  const normalizedUnlockedSlots = Math.max(
    1,
    unlockedPlantSlots,
    plants.length,
  );

  return {
    plants: plants.map((plant, index) => ({
      ...plant,
      slotKey: buildSlotKey(index + 1),
    })),
    unlockedPlantSlots: normalizedUnlockedSlots,
  };
}

function normalizePlantStateWithSlots(state: PlantState): PlantState {
  const normalizedUnlockedSlots = Math.max(
    1,
    state.unlockedPlantSlots,
    state.plants.length,
  );
  const occupied = new Set<number>();

  const normalizedPlants = state.plants.map((plant) => {
    const parsedSlotNumber = parseSlotNumber(plant.slotKey);
    let resolvedSlotNumber =
      parsedSlotNumber != null &&
      parsedSlotNumber <= normalizedUnlockedSlots &&
      !occupied.has(parsedSlotNumber)
        ? parsedSlotNumber
        : null;

    if (resolvedSlotNumber == null) {
      for (
        let slotNumber = 1;
        slotNumber <= normalizedUnlockedSlots;
        slotNumber += 1
      ) {
        if (!occupied.has(slotNumber)) {
          resolvedSlotNumber = slotNumber;
          break;
        }
      }
    }

    if (resolvedSlotNumber == null) {
      resolvedSlotNumber = normalizedUnlockedSlots + occupied.size + 1;
    }

    occupied.add(resolvedSlotNumber);

    return {
      ...plant,
      slotKey: buildSlotKey(resolvedSlotNumber),
    };
  });

  const activePlantExists =
    state.activePlantId != null &&
    normalizedPlants.some((plant) => plant.id === state.activePlantId);

  return {
    plants: normalizedPlants,
    photos: state.photos.map((photo) => ({ ...photo })),
    activePlantId: activePlantExists
      ? state.activePlantId
      : (normalizedPlants[0]?.id ?? null),
    unlockedPlantSlots: normalizedUnlockedSlots,
    reportState: cloneReportState(state.reportState),
  };
}

function isPlantState(value: unknown): value is PlantState {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.plants) &&
    value.plants.every(isPlantProfile) &&
    Array.isArray(value.photos) &&
    value.photos.every(isPlantPhoto) &&
    (value.activePlantId == null || typeof value.activePlantId === 'string') &&
    typeof value.unlockedPlantSlots === 'number' &&
    Number.isFinite(value.unlockedPlantSlots) &&
    value.unlockedPlantSlots >= 1 &&
    isDailyReportState(value.reportState)
  );
}

function isPlantStateV3Legacy(value: unknown): value is PlantStateV3Legacy {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.plants) &&
    value.plants.every(isPlantProfileLegacy) &&
    Array.isArray(value.photos) &&
    value.photos.every(isPlantPhoto) &&
    (value.activePlantId == null || typeof value.activePlantId === 'string') &&
    typeof value.unlockedPlantSlots === 'number' &&
    Number.isFinite(value.unlockedPlantSlots) &&
    value.unlockedPlantSlots >= 1 &&
    isDailyReportState(value.reportState)
  );
}

function isPlantStateV2(value: unknown): value is PlantStateV2 {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.plants) &&
    value.plants.every(isPlantProfileLegacy) &&
    Array.isArray(value.photos) &&
    value.photos.every(isPlantPhoto) &&
    (value.activePlantId == null || typeof value.activePlantId === 'string') &&
    typeof value.unlockedPlantSlots === 'number' &&
    Number.isFinite(value.unlockedPlantSlots) &&
    value.unlockedPlantSlots >= 1
  );
}

function isLegacyPlantState(value: unknown): value is LegacyPlantState {
  if (!isObject(value)) {
    return false;
  }

  return (
    (value.profile == null || isPlantProfileLegacy(value.profile)) &&
    Array.isArray(value.photos) &&
    value.photos.every(isPlantPhoto)
  );
}

function parseJSON(raw: string | null): unknown {
  if (raw == null) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function migrateV3ToV4(state: PlantStateV3Legacy): PlantState {
  const { plants, unlockedPlantSlots } = assignSlotKeys(
    state.plants,
    state.unlockedPlantSlots,
  );

  return {
    plants,
    photos: state.photos.map((photo) => ({ ...photo })),
    activePlantId: state.activePlantId,
    unlockedPlantSlots,
    reportState: cloneReportState(state.reportState),
  };
}

function migrateV2ToV4(state: PlantStateV2): PlantState {
  const { plants, unlockedPlantSlots } = assignSlotKeys(
    state.plants,
    state.unlockedPlantSlots,
  );

  return {
    plants,
    photos: state.photos.map((photo) => ({ ...photo })),
    activePlantId: state.activePlantId,
    unlockedPlantSlots,
    reportState: cloneReportState(DEFAULT_REPORT_STATE),
  };
}

function migrateLegacyState(legacyState: LegacyPlantState): PlantState {
  if (legacyState.profile == null) {
    return cloneState(INITIAL_STATE);
  }

  return {
    plants: [{ ...legacyState.profile, slotKey: buildSlotKey(1) }],
    photos: legacyState.photos.map((photo) => ({ ...photo })),
    activePlantId: legacyState.profile.id,
    unlockedPlantSlots: 1,
    reportState: cloneReportState(DEFAULT_REPORT_STATE),
  };
}

function parsePlantState(raw: string | null): PlantState | null {
  const parsed = parseJSON(raw);

  if (parsed == null) {
    return null;
  }

  if (isPlantState(parsed)) {
    return normalizePlantStateWithSlots(parsed);
  }

  if (isPlantStateV3Legacy(parsed)) {
    return migrateV3ToV4(parsed);
  }

  if (isPlantStateV2(parsed)) {
    return migrateV2ToV4(parsed);
  }

  if (isLegacyPlantState(parsed)) {
    return migrateLegacyState(parsed);
  }

  return null;
}

function notifyListeners() {
  const snapshot = getPlantState();

  for (const listener of listeners) {
    listener(snapshot);
  }
}

async function persistState(state: PlantState) {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[PlantGrowth] Failed to persist state:', error);
  }
}

function commitState(nextState: PlantState) {
  stateCache = cloneState(nextState);
  notifyListeners();
  void persistState(stateCache);
}

function updateState(updater: (current: PlantState) => PlantState) {
  const nextState = updater(getPlantState());
  commitState(nextState);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTimestamp(isoDate: string) {
  const time = Date.parse(isoDate);

  return Number.isNaN(time) ? 0 : time;
}

export function getDateKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getDateKeyFromISO(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return getDateKeyFromDate(date);
}

export function buildSceneConfirmationKey(photoId: string, capturedAt: string) {
  return `${photoId}|${capturedAt}`;
}

function sortPhotosByCapturedAtDesc(photos: PlantPhoto[]) {
  return [...photos].sort(
    (a, b) => getTimestamp(b.capturedAt) - getTimestamp(a.capturedAt),
  );
}

function parseDateKey(dateKey: string) {
  const parts = dateKey.split('-').map(Number);

  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [year, month, day] = parts as [number, number, number];
  return new Date(year, month, day);
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

export function getPlantState(): PlantState {
  return cloneState(stateCache);
}

export function isPlantStateHydrated() {
  return hydrated;
}

export function canCreatePlant(state: PlantState) {
  return state.plants.length < state.unlockedPlantSlots;
}

export function getPlantSlotKey(
  state: PlantState,
  plantId: string | null,
): string | null {
  if (plantId == null) {
    return null;
  }

  return state.plants.find((plant) => plant.id === plantId)?.slotKey ?? null;
}

export function getActivePlant(state: PlantState): PlantProfile | null {
  if (state.activePlantId == null) {
    return state.plants[0] ?? null;
  }

  return state.plants.find((plant) => plant.id === state.activePlantId) ?? null;
}

export function getPhotosForPlant(state: PlantState, plantId: string | null) {
  if (plantId == null) {
    return [];
  }

  return sortPhotosByCapturedAtDesc(
    state.photos.filter((photo) => photo.plantId === plantId),
  );
}

export function selectComparePair(
  state: PlantState,
  plantId: string | null = state.activePlantId,
): ComparePair | null {
  if (plantId == null) {
    return null;
  }

  const plant = state.plants.find((entry) => entry.id === plantId);

  if (plant == null) {
    return null;
  }

  const plantPhotos = getPhotosForPlant(state, plantId);

  if (plantPhotos.length === 0) {
    return null;
  }

  const baseline =
    plantPhotos.find((photo) => photo.id === plant.baselinePhotoId) ??
    plantPhotos.find((photo) => photo.isBaseline) ??
    plantPhotos[plantPhotos.length - 1];

  if (baseline == null) {
    return null;
  }

  const latest = plantPhotos[0] ?? baseline;

  return {
    baseline: { ...baseline },
    latest: { ...latest },
  };
}

export function isTodayReportUnlocked(
  state: PlantState,
  todayDateKey = getDateKeyFromDate(new Date()),
) {
  return state.reportState.lastUnlockedDateKey === todayDateKey;
}

export function isSceneConfirmationDone(state: PlantState, sceneKey: string) {
  return state.reportState.confirmedSceneKeys.includes(sceneKey);
}

export function confirmSceneForReport(sceneKey: string) {
  const normalizedKey = sceneKey.trim();

  if (normalizedKey.length === 0) {
    return;
  }

  updateState((current) => {
    if (current.reportState.confirmedSceneKeys.includes(normalizedKey)) {
      return current;
    }

    return {
      ...current,
      reportState: {
        ...current.reportState,
        confirmedSceneKeys: [
          normalizedKey,
          ...current.reportState.confirmedSceneKeys,
        ].slice(0, MAX_CONFIRMED_SCENE_KEYS),
      },
    };
  });
}

export function unlockTodayReport(
  todayDateKey = getDateKeyFromDate(new Date()),
): UnlockTodayReportResult {
  if (stateCache.reportState.lastUnlockedDateKey === todayDateKey) {
    return 'alreadyUnlocked';
  }

  updateState((current) => {
    const previousDateKey = current.reportState.lastUnlockDateKey;
    const dayDiff =
      previousDateKey == null
        ? Number.NaN
        : getDayDiff(previousDateKey, todayDateKey);
    const nextStreak = dayDiff === 1 ? current.reportState.streakCount + 1 : 1;
    const hasWeeklyBadge = current.reportState.badges.includes('weekly-7');
    const nextBadges =
      nextStreak >= 7 && !hasWeeklyBadge
        ? [...current.reportState.badges, 'weekly-7' as const]
        : current.reportState.badges;

    return {
      ...current,
      reportState: {
        lastUnlockedDateKey: todayDateKey,
        lastUnlockDateKey: todayDateKey,
        streakCount: nextStreak,
        badges: nextBadges,
        confirmedSceneKeys: current.reportState.confirmedSceneKeys,
      },
    };
  });

  return 'unlocked';
}

export async function hydratePlantState() {
  if (hydrated) {
    return getPlantState();
  }

  try {
    const currentState = parsePlantState(await Storage.getItem(STORAGE_KEY));

    if (currentState != null) {
      stateCache = currentState;
    } else {
      const legacyV3 = parsePlantState(
        await Storage.getItem(LEGACY_STORAGE_KEY_V3),
      );

      if (legacyV3 != null) {
        stateCache = legacyV3;
      } else {
        const legacyV2 = parsePlantState(
          await Storage.getItem(LEGACY_STORAGE_KEY_V2),
        );

        if (legacyV2 != null) {
          stateCache = legacyV2;
        } else {
          const legacyV1 = parsePlantState(
            await Storage.getItem(LEGACY_STORAGE_KEY_V1),
          );

          if (legacyV1 != null) {
            stateCache = legacyV1;
          } else {
            await persistState(stateCache);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[PlantGrowth] Failed to hydrate state:', error);
  }

  hydrated = true;
  notifyListeners();

  return getPlantState();
}

export function subscribePlantState(listener: Listener) {
  listeners.add(listener);
  listener(getPlantState());

  return () => {
    listeners.delete(listener);
  };
}

export function setActivePlant(plantId: string) {
  if (!stateCache.plants.some((plant) => plant.id === plantId)) {
    return;
  }

  updateState((current) => ({
    ...current,
    activePlantId: plantId,
  }));
}

export function unlockNextPlantSlot() {
  updateState((current) => ({
    ...current,
    unlockedPlantSlots: current.unlockedPlantSlots + 1,
  }));
}

export function updatePlantName(
  plantId: string,
  name: string,
): UpdatePlantNameResult {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return 'empty_name';
  }

  if (!stateCache.plants.some((plant) => plant.id === plantId)) {
    return 'not_found';
  }

  updateState((current) => ({
    ...current,
    plants: current.plants.map((plant) =>
      plant.id === plantId ? { ...plant, name: trimmedName } : plant,
    ),
  }));

  return 'ok';
}

export function deletePlantSlot(plantId: string): DeletePlantSlotResult {
  const normalizedPlantId = plantId.trim();

  if (
    normalizedPlantId.length === 0 ||
    !stateCache.plants.some((plant) => plant.id === normalizedPlantId)
  ) {
    return 'not_found';
  }

  updateState((current) => {
    const remainingPlants = current.plants.filter(
      (plant) => plant.id !== normalizedPlantId,
    );
    const removedPhotoIds = new Set(
      current.photos
        .filter((photo) => photo.plantId === normalizedPlantId)
        .map((photo) => photo.id),
    );
    const nextUnlockedPlantSlots = Math.max(
      1,
      current.unlockedPlantSlots - 1,
      remainingPlants.length,
    );
    const nextActivePlantId =
      current.activePlantId === normalizedPlantId
        ? (remainingPlants[0]?.id ?? null)
        : current.activePlantId;

    return normalizePlantStateWithSlots({
      ...current,
      plants: remainingPlants,
      photos: current.photos.filter(
        (photo) => photo.plantId !== normalizedPlantId,
      ),
      activePlantId: nextActivePlantId,
      unlockedPlantSlots: nextUnlockedPlantSlots,
      reportState: {
        ...current.reportState,
        confirmedSceneKeys: current.reportState.confirmedSceneKeys.filter(
          (sceneKey) => {
            const [photoId] = sceneKey.split('|');
            return !removedPhotoIds.has(photoId ?? '');
          },
        ),
      },
    });
  });

  return 'ok';
}

function findNextAvailableSlotKey(state: PlantState) {
  const occupied = new Set(state.plants.map((plant) => plant.slotKey));

  for (
    let slotNumber = 1;
    slotNumber <= state.unlockedPlantSlots;
    slotNumber += 1
  ) {
    const slotKey = buildSlotKey(slotNumber);

    if (!occupied.has(slotKey)) {
      return slotKey;
    }
  }

  return null;
}

export function createPlantBaseline({
  name,
  dataUri,
  mimeType,
  capturedAt = new Date().toISOString(),
  sourceDataUri,
  sourceMimeType,
  enhancementVersion,
  enhancementStatus,
}: {
  name?: string;
  dataUri: string;
  mimeType: string;
  capturedAt?: string;
  sourceDataUri?: string;
  sourceMimeType?: string;
  enhancementVersion?: string;
  enhancementStatus?: 'enhanced' | 'raw_fallback';
}): CreatePlantBaselineResult {
  if (!canCreatePlant(stateCache)) {
    return { ok: false, reason: 'slot_limit_reached' };
  }

  const slotKey = findNextAvailableSlotKey(stateCache);

  if (slotKey == null) {
    return { ok: false, reason: 'slot_limit_reached' };
  }

  const plantId = createId('plant');
  const baselinePhotoId = createId('photo');
  const trimmedName = name?.trim() ?? '';

  const profile: PlantProfile = {
    id: plantId,
    name: trimmedName.length > 0 ? trimmedName : DEFAULT_PLANT_NAME,
    createdAt: capturedAt,
    baselinePhotoId,
    slotKey,
  };

  const baselinePhoto: PlantPhoto = {
    id: baselinePhotoId,
    plantId,
    capturedAt,
    dataUri,
    mimeType,
    isBaseline: true,
    sourceDataUri,
    sourceMimeType,
    enhancementVersion,
    enhancementStatus,
  };

  updateState((current) => ({
    ...current,
    plants: [profile, ...current.plants],
    photos: [baselinePhoto, ...current.photos],
    activePlantId: plantId,
  }));

  return { ok: true, plantId, slotKey };
}

export function addDailyPhoto({
  dataUri,
  mimeType,
  capturedAt = new Date().toISOString(),
  plantId,
  sourceDataUri,
  sourceMimeType,
  enhancementVersion,
  enhancementStatus,
}: {
  dataUri: string;
  mimeType: string;
  capturedAt?: string;
  plantId?: string;
  sourceDataUri?: string;
  sourceMimeType?: string;
  enhancementVersion?: string;
  enhancementStatus?: 'enhanced' | 'raw_fallback';
}) {
  const activePlant = getActivePlant(stateCache);
  const targetPlantId = plantId ?? activePlant?.id ?? null;

  if (targetPlantId == null) {
    return null;
  }

  const targetPlant = stateCache.plants.find(
    (plant) => plant.id === targetPlantId,
  );

  if (targetPlant == null) {
    return null;
  }

  const slotKey = targetPlant.slotKey;

  const dayKey = getDateKeyFromISO(capturedAt);
  const didOverwriteSameDay = stateCache.photos.some(
    (photo) =>
      photo.plantId === targetPlantId &&
      getDateKeyFromISO(photo.capturedAt) === dayKey,
  );

  updateState((current) => {
    const sameDayPhotos = current.photos.filter(
      (photo) =>
        photo.plantId === targetPlantId &&
        getDateKeyFromISO(photo.capturedAt) === dayKey,
    );
    const latestTargetPlant = current.plants.find(
      (plant) => plant.id === targetPlantId,
    );
    const baselinePhoto = sameDayPhotos.find(
      (photo) => photo.id === latestTargetPlant?.baselinePhotoId,
    );
    const replaceTarget = baselinePhoto ?? sameDayPhotos[0] ?? null;

    const nextPhoto: PlantPhoto = {
      id: replaceTarget?.id ?? createId('photo'),
      plantId: targetPlantId,
      capturedAt,
      dataUri,
      mimeType,
      isBaseline: replaceTarget?.isBaseline ?? false,
      sourceDataUri,
      sourceMimeType,
      enhancementVersion,
      enhancementStatus,
    };

    const nextPhotos = [
      nextPhoto,
      ...current.photos.filter(
        (photo) =>
          !(
            photo.plantId === targetPlantId &&
            getDateKeyFromISO(photo.capturedAt) === dayKey
          ),
      ),
    ];

    return {
      ...current,
      photos: nextPhotos,
      activePlantId: targetPlantId,
    };
  });

  return {
    state: getPlantState(),
    didOverwriteSameDay,
    slotKey,
  } satisfies AddDailyPhotoResult;
}
