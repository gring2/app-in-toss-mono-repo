jest.mock('./client', () => ({
  ensureAnonymousSession: jest.fn(),
  supabase: {
    rpc: jest.fn(),
  },
}));

jest.mock('../toss/owner-identity', () => ({
  getOwnerIdentityKey: jest.fn(),
}));

import { ensureAnonymousSession, supabase } from './client';
import { getOwnerIdentityKey } from '../toss/owner-identity';
import { createRoom, getInvite, getRoomResult, listOwnerRooms, submitFriendResponse, type AnswerScore } from './perception-api';
import { createDefaultQuestionDrafts, createDefaultSurveyQuestions } from '../../features/perception/questions';

const ensureSessionMock = ensureAnonymousSession as jest.MockedFunction<typeof ensureAnonymousSession>;
const getOwnerIdentityKeyMock = getOwnerIdentityKey as jest.MockedFunction<typeof getOwnerIdentityKey>;
const rpcMock = supabase.rpc as unknown as jest.Mock;

describe('perception API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureSessionMock.mockResolvedValue();
    getOwnerIdentityKeyMock.mockResolvedValue('stable-owner-key');
  });

  it('rejects malformed answer sets before making a request', async () => {
    await expect(createRoom('민준', createDefaultQuestionDrafts(), [1, 2] as AnswerScore[])).rejects.toThrow('답변 8개');

    expect(ensureSessionMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('maps the room creation response', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          room_id: 'room-1',
          invite_token: 'token-1',
          expires_at: '2026-09-10T00:00:00Z',
        },
      ],
      error: null,
    });

    await expect(createRoom('민준', createDefaultQuestionDrafts(), [1, 2, 3, 4, 5, 1, 2, 3])).resolves.toEqual({
      roomId: 'room-1',
      inviteToken: 'token-1',
      expiresAt: '2026-09-10T00:00:00Z',
    });

    expect(rpcMock).toHaveBeenCalledWith('create_perception_room_v4', {
      p_display_name: '민준',
      p_owner_key: 'stable-owner-key',
      p_self_answers: [1, 2, 3, 4, 5, 1, 2, 3],
      p_questions: createDefaultQuestionDrafts().map((question) => question.prompt),
      p_question_images: Array.from({ length: 8 }, () => null),
    });
  });

  it('keeps the server reveal flag on a friend submission', async () => {
    rpcMock.mockResolvedValue({
      data: {
        room_id: 'room-1',
        response_count: 3,
        required_count: 3,
        revealed: true,
      },
      error: null,
    });

    await expect(submitFriendResponse('token-1', [5, 4, 3, 2, 1, 5, 4, 3])).resolves.toEqual({
      roomId: 'room-1',
      responseCount: 3,
      requiredCount: 3,
      revealed: true,
    });

    expect(rpcMock).toHaveBeenCalledWith('submit_perception_response_v2', {
      p_invite_token: 'token-1',
      p_answers: [5, 4, 3, 2, 1, 5, 4, 3],
      p_owner_key: 'stable-owner-key',
    });
  });

  it('maps invite privacy and ownership flags', async () => {
    rpcMock.mockResolvedValue({
      data: {
        room_id: 'room-1',
        display_name: '민준',
        expires_at: '2026-09-10T00:00:00Z',
        response_count: 1,
        question_count: 8,
        questions: createDefaultQuestionDrafts().map((question) => question.prompt),
        question_images: [null, 'aGVsbG8=', null, null, null, null, null, null],
        already_answered: true,
        is_owner: false,
      },
      error: null,
    });

    await expect(getInvite('token-1')).resolves.toEqual({
      roomId: 'room-1',
      displayName: '민준',
      expiresAt: '2026-09-10T00:00:00Z',
      responseCount: 1,
      questionCount: 8,
      questions: [
        createDefaultSurveyQuestions()[0],
        { ...createDefaultSurveyQuestions()[1], imageUri: 'data:image/jpeg;base64,aGVsbG8=' },
        ...createDefaultSurveyQuestions().slice(2),
      ],
      alreadyAnswered: true,
      isOwner: false,
    });

    expect(rpcMock).toHaveBeenCalledWith('get_perception_invite_v2', {
      p_invite_token: 'token-1',
      p_owner_key: 'stable-owner-key',
    });
  });

  it('does not require aggregate arrays while a room is waiting', async () => {
    rpcMock.mockResolvedValue({
      data: {
        room_id: 'room-1',
        display_name: '민준',
        expires_at: '2026-09-10T00:00:00Z',
        response_count: 2,
        required_count: 3,
        questions: createDefaultQuestionDrafts().map((question) => question.prompt),
        question_images: Array.from({ length: 8 }, () => null),
        revealed: false,
      },
      error: null,
    });

    await expect(getRoomResult('room-1')).resolves.toEqual({
      roomId: 'room-1',
      displayName: '민준',
      expiresAt: '2026-09-10T00:00:00Z',
      responseCount: 2,
      requiredCount: 3,
      questions: createDefaultSurveyQuestions(),
      revealed: false,
    });
  });

  it('maps the owner room list summary', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          room_id: 'room-1',
          display_name: '민준',
          created_at: '2026-08-20T00:00:00Z',
          expires_at: '2026-09-19T00:00:00Z',
          response_count: 2,
          required_count: 3,
          revealed: false,
        },
      ],
      error: null,
    });

    await expect(listOwnerRooms()).resolves.toEqual([
      {
        roomId: 'room-1',
        displayName: '민준',
        createdAt: '2026-08-20T00:00:00Z',
        expiresAt: '2026-09-19T00:00:00Z',
        responseCount: 2,
        requiredCount: 3,
        revealed: false,
      },
    ]);

    expect(rpcMock).toHaveBeenCalledWith('list_perception_rooms_v2', {
      p_owner_key: 'stable-owner-key',
    });
  });

  it('uses the v2 owner RPC when loading room results', async () => {
    rpcMock.mockResolvedValue({
      data: {
        room_id: 'room-1',
        display_name: '민준',
        expires_at: '2026-09-10T00:00:00Z',
        response_count: 2,
        required_count: 3,
        revealed: false,
      },
      error: null,
    });

    await getRoomResult('room-1');

    expect(rpcMock).toHaveBeenCalledWith('get_perception_results_v2', {
      p_owner_key: 'stable-owner-key',
      p_room_id: 'room-1',
    });
  });

  it('rejects malformed owner room responses', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          room_id: 'room-1',
          display_name: '민준',
          created_at: '2026-08-20T00:00:00Z',
          expires_at: '2026-09-19T00:00:00Z',
          response_count: '2',
          required_count: 3,
          revealed: false,
        },
      ],
      error: null,
    });

    await expect(listOwnerRooms()).rejects.toThrow('response_count');
  });
});
