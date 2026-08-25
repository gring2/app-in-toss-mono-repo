jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { Storage } from '@apps-in-toss/framework';
import {
  loadOwnerRoomSnapshots,
  removeOwnerRoomSnapshot,
  removeOwnerRoomSnapshots,
  saveOwnerRoomSnapshot,
  type OwnerRoomSnapshot,
} from './owner-room-storage';

const getItemMock = Storage.getItem as jest.MockedFunction<typeof Storage.getItem>;
const setItemMock = Storage.setItem as jest.MockedFunction<typeof Storage.setItem>;
const removeItemMock = Storage.removeItem as jest.MockedFunction<typeof Storage.removeItem>;
let storageState: Record<string, string | undefined>;

const snapshot: OwnerRoomSnapshot = {
  displayName: '민준',
  room: {
    roomId: 'room-1',
    inviteToken: 'token-1',
    expiresAt: '2026-09-10T00:00:00Z',
  },
};

const newerSnapshot: OwnerRoomSnapshot = {
  displayName: '서연',
  room: {
    roomId: 'room-2',
    inviteToken: 'token-2',
    expiresAt: '2026-09-20T00:00:00Z',
  },
  createdAt: '2026-08-20T00:00:00Z',
};

describe('owner room storage', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T00:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    storageState = {};
    getItemMock.mockImplementation(async (key) => storageState[key] ?? null);
    setItemMock.mockImplementation(async (key, value) => {
      storageState[key] = value;
    });
    removeItemMock.mockImplementation(async (key) => {
      delete storageState[key];
    });
  });

  it('saves multiple room snapshots in v2 with the latest room first', async () => {
    await saveOwnerRoomSnapshot(snapshot);
    await saveOwnerRoomSnapshot(newerSnapshot);

    await expect(loadOwnerRoomSnapshots()).resolves.toEqual([
      newerSnapshot,
      {
        ...snapshot,
        createdAt: '2026-08-11T00:00:00.000Z',
      },
    ]);
    expect(setItemMock).toHaveBeenLastCalledWith(
      'friend-lens:owner-rooms:v2',
      JSON.stringify([
        newerSnapshot,
        {
          ...snapshot,
          createdAt: '2026-08-11T00:00:00.000Z',
        },
      ])
    );
  });

  it('migrates a valid v1 snapshot into the v2 array while preserving the invite token', async () => {
    storageState['friend-lens:owner-room:v1'] = JSON.stringify(snapshot);

    await expect(loadOwnerRoomSnapshots()).resolves.toEqual([
      {
        ...snapshot,
        createdAt: '2026-08-11T00:00:00.000Z',
      },
    ]);

    expect(setItemMock).toHaveBeenCalledWith(
      'friend-lens:owner-rooms:v2',
      JSON.stringify([
        {
          ...snapshot,
          createdAt: '2026-08-11T00:00:00.000Z',
        },
      ])
    );
    expect(removeItemMock).toHaveBeenCalledWith('friend-lens:owner-room:v1');
  });

  it('discards malformed local data and removes individual rooms explicitly', async () => {
    storageState['friend-lens:owner-rooms:v2'] = '{bad json';
    storageState['friend-lens:owner-room:v1'] = '{bad json';

    await expect(loadOwnerRoomSnapshots()).resolves.toEqual([]);
    expect(removeItemMock).toHaveBeenCalledWith('friend-lens:owner-rooms:v2');
    expect(removeItemMock).toHaveBeenCalledWith('friend-lens:owner-room:v1');

    storageState['friend-lens:owner-rooms:v2'] = JSON.stringify([snapshot, newerSnapshot]);
    await removeOwnerRoomSnapshot('room-1');

    expect(setItemMock).toHaveBeenLastCalledWith('friend-lens:owner-rooms:v2', JSON.stringify([newerSnapshot]));

  });

  it('removes multiple rooms with one read-filter-write cycle', async () => {
    const thirdSnapshot: OwnerRoomSnapshot = {
      displayName: '지우',
      room: {
        roomId: 'room-3',
        inviteToken: 'token-3',
        expiresAt: '2026-09-19T00:00:00Z',
      },
      createdAt: '2026-08-20T00:00:00Z',
    };
    storageState['friend-lens:owner-rooms:v2'] = JSON.stringify([snapshot, newerSnapshot, thirdSnapshot]);

    await removeOwnerRoomSnapshots(['room-1', 'room-2']);

    expect(setItemMock).toHaveBeenLastCalledWith('friend-lens:owner-rooms:v2', JSON.stringify([thirdSnapshot]));
  });

  it('rewrites v2 storage after pruning expired snapshots', async () => {
    const expiredSnapshot: OwnerRoomSnapshot = {
      displayName: '만료',
      room: {
        roomId: 'expired-room',
        inviteToken: 'expired-token',
        expiresAt: '2026-08-19T00:00:00Z',
      },
      createdAt: '2026-07-20T00:00:00Z',
    };
    storageState['friend-lens:owner-rooms:v2'] = JSON.stringify([expiredSnapshot, newerSnapshot]);

    await expect(loadOwnerRoomSnapshots()).resolves.toEqual([newerSnapshot]);
    expect(setItemMock).toHaveBeenLastCalledWith('friend-lens:owner-rooms:v2', JSON.stringify([newerSnapshot]));
  });
});
