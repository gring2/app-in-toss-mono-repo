import { Storage } from '@apps-in-toss/native-modules';

export type PlantProfile = {
  id: string;
  name: string;
  createdAt: string;
  baselinePhotoId: string;
};

export type PlantPhoto = {
  id: string;
  plantId: string;
  capturedAt: string;
  dataUri: string;
  mimeType: string;
  isBaseline: boolean;
};

export type PlantState = {
  profile: PlantProfile | null;
  photos: PlantPhoto[];
};

export type ComparePair = {
  baseline: PlantPhoto;
  latest: PlantPhoto;
};

type Listener = (state: PlantState) => void;

const STORAGE_KEY = 'plant-growth-v1';
const DEFAULT_PLANT_NAME = '나의 식물';
const INITIAL_STATE: PlantState = {
  profile: null,
  photos: [],
};

let stateCache: PlantState = cloneState(INITIAL_STATE);
let hydrated = false;
const listeners = new Set<Listener>();

function cloneState(state: PlantState): PlantState {
  return {
    profile: state.profile == null ? null : { ...state.profile },
    photos: state.photos.map((photo) => ({ ...photo })),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function isPlantProfile(value: unknown): value is PlantProfile {
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

function isPlantPhoto(value: unknown): value is PlantPhoto {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.plantId === 'string' &&
    typeof value.capturedAt === 'string' &&
    typeof value.dataUri === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.isBaseline === 'boolean'
  );
}

function isPlantState(value: unknown): value is PlantState {
  if (!isObject(value)) {
    return false;
  }

  const profile = value.profile;
  const photos = value.photos;

  return (
    (profile == null || isPlantProfile(profile)) &&
    Array.isArray(photos) &&
    photos.every(isPlantPhoto)
  );
}

function parsePlantState(raw: string | null): PlantState | null {
  if (raw == null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!isPlantState(parsed)) {
      return null;
    }

    return cloneState(parsed);
  } catch {
    return null;
  }
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

export function selectComparePair(state: PlantState): ComparePair | null {
  if (state.profile == null || state.photos.length === 0) {
    return null;
  }

  const baseline =
    state.photos.find((photo) => photo.id === state.profile?.baselinePhotoId) ??
    state.photos.find((photo) => photo.isBaseline) ??
    state.photos[state.photos.length - 1];

  if (baseline == null) {
    return null;
  }

  let latest = baseline;

  for (const photo of state.photos) {
    if (getTimestamp(photo.capturedAt) >= getTimestamp(latest.capturedAt)) {
      latest = photo;
    }
  }

  return {
    baseline: { ...baseline },
    latest: { ...latest },
  };
}

export function getPlantState(): PlantState {
  return cloneState(stateCache);
}

export function getComparePair() {
  return selectComparePair(stateCache);
}

export function isPlantStateHydrated() {
  return hydrated;
}

export async function hydratePlantState() {
  if (hydrated) {
    return getPlantState();
  }

  try {
    const fromStorage = parsePlantState(await Storage.getItem(STORAGE_KEY));

    if (fromStorage != null) {
      stateCache = fromStorage;
    } else {
      await persistState(stateCache);
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

export function createPlantBaseline({
  name,
  dataUri,
  mimeType,
  capturedAt = new Date().toISOString(),
}: {
  name?: string;
  dataUri: string;
  mimeType: string;
  capturedAt?: string;
}) {
  if (stateCache.profile != null) {
    return getPlantState();
  }

  const plantId = createId('plant');
  const baselinePhotoId = createId('photo');
  const trimmedName = name?.trim() ?? '';

  const profile: PlantProfile = {
    id: plantId,
    name: trimmedName.length > 0 ? trimmedName : DEFAULT_PLANT_NAME,
    createdAt: capturedAt,
    baselinePhotoId,
  };

  const baselinePhoto: PlantPhoto = {
    id: baselinePhotoId,
    plantId,
    capturedAt,
    dataUri,
    mimeType,
    isBaseline: true,
  };

  updateState(() => ({
    profile,
    photos: [baselinePhoto],
  }));

  return getPlantState();
}

export function addDailyPhoto({
  dataUri,
  mimeType,
  capturedAt = new Date().toISOString(),
}: {
  dataUri: string;
  mimeType: string;
  capturedAt?: string;
}) {
  if (stateCache.profile == null) {
    return null;
  }

  const photo: PlantPhoto = {
    id: createId('photo'),
    plantId: stateCache.profile.id,
    capturedAt,
    dataUri,
    mimeType,
    isBaseline: false,
  };

  updateState((current) => ({
    ...current,
    photos: [photo, ...current.photos],
  }));

  return getPlantState();
}
