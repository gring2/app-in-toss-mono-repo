jest.mock('../../lib/supabase/perception-api', () => ({
  getRoomResult: jest.fn(),
  listOwnerRooms: jest.fn(),
}));

jest.mock('./owner-room-storage', () => ({
  loadOwnerRoomSnapshots: jest.fn(),
  removeOwnerRoomSnapshots: jest.fn(),
}));

import { getRoomResult, listOwnerRooms } from '../../lib/supabase/perception-api';
import { removeOwnerRoomSnapshots, type OwnerRoomSnapshot } from './owner-room-storage';
import { loadHistoryItems } from './owner-room-history';
import { createDefaultSurveyQuestions } from './questions';

const getRoomResultMock = getRoomResult as jest.MockedFunction<typeof getRoomResult>;
const listOwnerRoomsMock = listOwnerRooms as jest.MockedFunction<typeof listOwnerRooms>;
const removeOwnerRoomSnapshotsMock = removeOwnerRoomSnapshots as jest.MockedFunction<typeof removeOwnerRoomSnapshots>;

describe('owner room history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('merges server summaries with unmatched local rooms and preserves local invite tokens', async () => {
    const snapshots: OwnerRoomSnapshot[] = [
      {
        displayName: '서버방',
        room: { roomId: 'server-room', inviteToken: 'server-token', expiresAt: '2026-09-20T00:00:00Z' },
        createdAt: '2026-08-21T00:00:00Z',
      },
      {
        displayName: '로컬방',
        room: { roomId: 'local-room', inviteToken: 'local-token', expiresAt: '2026-09-22T00:00:00Z' },
      },
    ];
    listOwnerRoomsMock.mockResolvedValue([
      {
        roomId: 'server-room',
        displayName: '서버방',
        createdAt: '2026-08-21T00:00:00Z',
        expiresAt: '2026-09-20T00:00:00Z',
        responseCount: 2,
        requiredCount: 3,
        revealed: false,
      },
    ]);
    getRoomResultMock.mockResolvedValue({
      roomId: 'local-room',
      displayName: '로컬방',
      expiresAt: '2026-09-22T00:00:00Z',
      responseCount: 1,
      requiredCount: 3,
      questions: createDefaultSurveyQuestions(),
      revealed: false,
    });

    await expect(loadHistoryItems(snapshots)).resolves.toEqual([
      expect.objectContaining({
        roomId: 'local-room',
        createdAt: '2026-08-23T00:00:00.000Z',
        inviteToken: 'local-token',
      }),
      expect.objectContaining({ roomId: 'server-room', inviteToken: 'server-token' }),
    ]);
    expect(getRoomResultMock).toHaveBeenCalledWith('local-room');
    expect(removeOwnerRoomSnapshotsMock).not.toHaveBeenCalled();
  });

  it('drops stale unmatched snapshots and removes them in one batch', async () => {
    const snapshots: OwnerRoomSnapshot[] = [
      {
        displayName: '오래된 방 1',
        room: { roomId: 'stale-1', inviteToken: 'token-1', expiresAt: '2026-09-20T00:00:00Z' },
      },
      {
        displayName: '오래된 방 2',
        room: { roomId: 'stale-2', inviteToken: 'token-2', expiresAt: '2026-09-21T00:00:00Z' },
      },
    ];
    listOwnerRoomsMock.mockResolvedValue([]);
    getRoomResultMock.mockResolvedValue(null);
    removeOwnerRoomSnapshotsMock.mockResolvedValue();

    await expect(loadHistoryItems(snapshots)).resolves.toEqual([]);
    expect(removeOwnerRoomSnapshotsMock).toHaveBeenCalledWith(['stale-1', 'stale-2']);
  });
});
