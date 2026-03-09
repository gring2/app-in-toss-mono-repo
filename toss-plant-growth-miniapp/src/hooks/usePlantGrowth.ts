import React from 'react';
import {
  type PlantState,
  addDailyPhoto,
  buildSceneConfirmationKey,
  canCreatePlant,
  confirmSceneForReport,
  createPlantBaseline,
  deletePlantSlot,
  getActivePlant,
  getDateKeyFromDate,
  getPhotosForPlant,
  hydratePlantState,
  isPlantStateHydrated,
  isSceneConfirmationDone,
  isTodayReportUnlocked,
  selectComparePair,
  setActivePlant,
  subscribePlantState,
  unlockNextPlantSlot,
  unlockTodayReport,
  updatePlantName,
} from '../plants/store';

function toDateKey(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function selectLatestCapturedAt(capturedDates: string[]) {
  if (capturedDates.length === 0) {
    return null;
  }

  return capturedDates.reduce((latestDate, currentDate) => {
    if (Date.parse(currentDate) > Date.parse(latestDate)) {
      return currentDate;
    }

    return latestDate;
  });
}

const EMPTY_STATE: PlantState = {
  plants: [],
  photos: [],
  activePlantId: null,
  unlockedPlantSlots: 1,
  reportState: {
    lastUnlockedDateKey: null,
    lastUnlockDateKey: null,
    streakCount: 0,
    badges: [],
    confirmedSceneKeys: [],
  },
};

export function usePlantGrowth() {
  const [state, setState] = React.useState<PlantState>(() => EMPTY_STATE);
  const [isReady, setIsReady] = React.useState(() => isPlantStateHydrated());

  React.useEffect(() => {
    const unsubscribe = subscribePlantState(setState);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    void hydratePlantState().finally(() => {
      if (isMounted) {
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const activePlant = React.useMemo(() => getActivePlant(state), [state]);
  const activePlantPhotos = React.useMemo(
    () => getPhotosForPlant(state, activePlant?.id ?? null),
    [activePlant, state],
  );
  const comparePair = React.useMemo(
    () => selectComparePair(state, activePlant?.id ?? null),
    [activePlant, state],
  );
  const lastCapturedAt = React.useMemo(
    () =>
      selectLatestCapturedAt(
        activePlantPhotos.map((photo) => photo.capturedAt),
      ),
    [activePlantPhotos],
  );
  const canCaptureToday = React.useMemo(() => {
    if (lastCapturedAt == null) {
      return true;
    }

    return toDateKey(lastCapturedAt) !== toDateKey(new Date().toISOString());
  }, [lastCapturedAt]);
  const canAddPlant = React.useMemo(() => canCreatePlant(state), [state]);
  const todayDateKey = React.useMemo(() => getDateKeyFromDate(new Date()), []);
  const todayReportUnlocked = React.useMemo(
    () => isTodayReportUnlocked(state, todayDateKey),
    [state, todayDateKey],
  );

  return {
    isReady,
    plants: state.plants,
    activePlant,
    activePlantPhotos,
    comparePair,
    lastCapturedAt,
    canCaptureToday,
    canAddPlant,
    unlockedPlantSlots: state.unlockedPlantSlots,
    reportState: state.reportState,
    isSceneConfirmationDone: (photoId: string, capturedAt: string) =>
      isSceneConfirmationDone(
        state,
        buildSceneConfirmationKey(photoId, capturedAt),
      ),
    todayDateKey,
    todayReportUnlocked,
    createBaseline: createPlantBaseline,
    addDailyPhoto,
    setActivePlant,
    unlockNextPlantSlot,
    unlockTodayReport,
    confirmSceneForReport,
    updatePlantName,
    deletePlantSlot,
  };
}
