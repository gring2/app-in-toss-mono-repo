import React from 'react';
import {
  addDailyPhoto,
  createPlantBaseline,
  hydratePlantState,
  isPlantStateHydrated,
  type PlantState,
  selectComparePair,
  subscribePlantState,
} from '../plants/store';

function toDateKey(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function selectLatestCapturedAt(state: PlantState) {
  if (state.photos.length === 0) {
    return null;
  }

  return state.photos.reduce((latest, photo) => {
    if (Date.parse(photo.capturedAt) > Date.parse(latest.capturedAt)) {
      return photo;
    }

    return latest;
  }).capturedAt;
}

export function usePlantGrowth() {
  const [state, setState] = React.useState<PlantState>(() => ({
    profile: null,
    photos: [],
  }));
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

  const comparePair = React.useMemo(() => selectComparePair(state), [state]);
  const lastCapturedAt = React.useMemo(() => selectLatestCapturedAt(state), [state]);
  const canCaptureToday = React.useMemo(() => {
    if (lastCapturedAt == null) {
      return true;
    }

    return toDateKey(lastCapturedAt) !== toDateKey(new Date().toISOString());
  }, [lastCapturedAt]);

  return {
    isReady,
    profile: state.profile,
    photos: state.photos,
    comparePair,
    lastCapturedAt,
    canCaptureToday,
    createBaseline: createPlantBaseline,
    addDailyPhoto,
  };
}
