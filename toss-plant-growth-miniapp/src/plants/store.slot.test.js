const mockStorageMap = new Map();

jest.mock('@apps-in-toss/native-modules', () => ({
  Storage: {
    getItem: jest.fn(async (key) =>
      mockStorageMap.has(key) ? mockStorageMap.get(key) : null,
    ),
    setItem: jest.fn(async (key, value) => {
      mockStorageMap.set(key, value);
    }),
  },
}));

function loadStoreModule() {
  return require('./store');
}

const IMAGE_URI = 'data:image/jpeg;base64,AA==';
const MIME_TYPE = 'image/jpeg';

describe('plants/store slot behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    mockStorageMap.clear();
  });

  it('truncates slot count when deleting a slot and requires one unlock to add it back', async () => {
    const store = loadStoreModule();
    await store.hydratePlantState();

    store.unlockNextPlantSlot();

    const first = store.createPlantBaseline({
      name: '식물 1',
      dataUri: IMAGE_URI,
      mimeType: MIME_TYPE,
      capturedAt: '2026-03-04T00:00:00.000Z',
    });
    const second = store.createPlantBaseline({
      name: '식물 2',
      dataUri: IMAGE_URI,
      mimeType: MIME_TYPE,
      capturedAt: '2026-03-04T00:10:00.000Z',
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    if (!first.ok || !second.ok) {
      throw new Error('baseline setup failed');
    }

    expect(first.slotKey).toBe('slot-1');
    expect(second.slotKey).toBe('slot-2');

    expect(store.deletePlantSlot(first.plantId)).toBe('ok');

    const stateAfterDelete = store.getPlantState();
    expect(stateAfterDelete.unlockedPlantSlots).toBe(1);
    expect(stateAfterDelete.plants).toHaveLength(1);
    expect(stateAfterDelete.plants[0].slotKey).toBe('slot-1');
    expect(store.canCreatePlant(stateAfterDelete)).toBe(false);

    store.unlockNextPlantSlot();
    const stateAfterUnlock = store.getPlantState();
    expect(stateAfterUnlock.unlockedPlantSlots).toBe(2);
    expect(store.canCreatePlant(stateAfterUnlock)).toBe(true);

    const third = store.createPlantBaseline({
      name: '식물 3',
      dataUri: IMAGE_URI,
      mimeType: MIME_TYPE,
      capturedAt: '2026-03-04T00:20:00.000Z',
    });

    expect(third.ok).toBe(true);

    if (!third.ok) {
      throw new Error('third baseline setup failed');
    }

    expect(third.slotKey).toBe('slot-2');
  });

  it('keeps minimum slot count at 1 when deleting the last plant', async () => {
    const store = loadStoreModule();
    await store.hydratePlantState();

    const first = store.createPlantBaseline({
      name: '식물 1',
      dataUri: IMAGE_URI,
      mimeType: MIME_TYPE,
      capturedAt: '2026-03-04T00:00:00.000Z',
    });

    expect(first.ok).toBe(true);

    if (!first.ok) {
      throw new Error('baseline setup failed');
    }

    expect(store.deletePlantSlot(first.plantId)).toBe('ok');

    const stateAfterDelete = store.getPlantState();
    expect(stateAfterDelete.plants).toHaveLength(0);
    expect(stateAfterDelete.unlockedPlantSlots).toBe(1);
  });

  it('migrates legacy v3 state by assigning stable slot keys', async () => {
    mockStorageMap.set(
      'plant-growth-v3',
      JSON.stringify({
        plants: [
          {
            id: 'plant-1',
            name: '기존 식물',
            createdAt: '2026-03-03T00:00:00.000Z',
            baselinePhotoId: 'photo-1',
          },
        ],
        photos: [
          {
            id: 'photo-1',
            plantId: 'plant-1',
            capturedAt: '2026-03-03T00:00:00.000Z',
            dataUri: IMAGE_URI,
            mimeType: MIME_TYPE,
            isBaseline: true,
          },
        ],
        activePlantId: 'plant-1',
        unlockedPlantSlots: 2,
        reportState: {
          lastUnlockedDateKey: null,
          lastUnlockDateKey: null,
          streakCount: 0,
          badges: [],
          confirmedSceneKeys: [],
        },
      }),
    );

    const store = loadStoreModule();
    await store.hydratePlantState();
    const state = store.getPlantState();

    expect(state.unlockedPlantSlots).toBe(2);
    expect(state.plants).toHaveLength(1);
    expect(state.plants[0].slotKey).toBe('slot-1');
  });

  it('returns slot key in daily photo result for slot-aware ad pacing', async () => {
    const store = loadStoreModule();
    await store.hydratePlantState();

    const created = store.createPlantBaseline({
      name: '식물 1',
      dataUri: IMAGE_URI,
      mimeType: MIME_TYPE,
      capturedAt: '2026-03-04T08:00:00.000Z',
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      throw new Error('baseline setup failed');
    }

    const daily = store.addDailyPhoto({
      plantId: created.plantId,
      dataUri: IMAGE_URI,
      mimeType: MIME_TYPE,
      capturedAt: '2026-03-05T08:00:00.000Z',
    });

    expect(daily).not.toBeNull();

    if (daily == null) {
      throw new Error('daily photo setup failed');
    }

    expect(daily.slotKey).toBe(created.slotKey);
  });
});
