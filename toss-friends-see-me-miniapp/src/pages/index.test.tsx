jest.mock('../lib/supabase/perception-api', () => ({
  createRoom: jest.fn(),
  deleteRoom: jest.fn(),
  getRoomResult: jest.fn(),
  listOwnerRooms: jest.fn(),
  rotateInvite: jest.fn(),
}));

jest.mock('../features/perception/owner-room-storage', () => ({
  loadOwnerRoomSnapshots: jest.fn(),
  removeOwnerRoomSnapshot: jest.fn(),
  removeOwnerRoomSnapshots: jest.fn(),
  saveOwnerRoomSnapshot: jest.fn(),
}));

jest.mock('../features/perception/share-invite', () => ({
  shareInvite: jest.fn(),
}));

jest.mock('@apps-in-toss/framework', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');

  return {
    Analytics: {
      Impression: ({ children }: MockProviderProps) =>
        ReactModule.createElement(ReactModule.Fragment, null, children),
      Press: ({ children }: MockProviderProps) =>
        ReactModule.createElement(ReactModule.Fragment, null, children),
    },
    FetchAlbumPhotosPermissionError: class FetchAlbumPhotosPermissionError extends Error {},
    fetchAlbumPhotos: jest.fn(),
  };
});

jest.mock('@toss/tds-react-native', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const ReactNative = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Button: ({ children, loading, ...props }: MockButtonProps) =>
      ReactModule.createElement(
        ReactNative.Pressable,
        { ...props, disabled: props.disabled || loading },
        ReactModule.createElement(ReactNative.Text, null, children)
      ),
    ProgressBar: ({ progress, size, color, ...props }: MockProgressBarProps) =>
      ReactModule.createElement(ReactNative.View, {
        ...props,
        accessibilityLabel: `${progress}-${size}-${color ?? 'default'}`,
      }),
    TDSProvider: ({ children }: MockProviderProps) => ReactModule.createElement(ReactModule.Fragment, null, children),
    TextField: ({ help, ...props }: MockTextFieldProps) =>
      ReactModule.createElement(
        ReactNative.View,
        null,
        ReactModule.createElement(ReactNative.TextInput, props),
        help == null ? null : ReactModule.createElement(ReactNative.Text, null, help)
      ),
    Txt: ({ children, ...props }: MockTxtProps) => ReactModule.createElement(ReactNative.Text, props, children),
  };
});

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { FetchAlbumPhotosPermissionError, fetchAlbumPhotos } from '@apps-in-toss/framework';
import type { RenderAPI } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import React from 'react';
import type { PressableProps, TextInputProps, TextProps, ViewProps } from 'react-native';
import {
  loadOwnerRoomSnapshots,
  removeOwnerRoomSnapshot,
  removeOwnerRoomSnapshots,
  saveOwnerRoomSnapshot,
} from '../features/perception/owner-room-storage';
import {
  createDefaultQuestionDrafts,
  createDefaultSurveyQuestions,
  createQuestionDraftsFromTemplate,
  PERCEPTION_QUESTIONS,
} from '../features/perception/questions';
import { shareInvite } from '../features/perception/share-invite';
import {
  createRoom,
  deleteRoom,
  getRoomResult,
  listOwnerRooms,
  rotateInvite,
} from '../lib/supabase/perception-api';
import { Page } from './index';

interface MockButtonProps extends PressableProps {
  children: ReactNode;
  loading?: boolean;
}

interface MockProgressBarProps extends ViewProps {
  progress: number;
  size: string;
  color?: string;
}

interface MockProviderProps {
  children: ReactNode;
}

interface MockTextFieldProps extends TextInputProps {
  variant: string;
  labelOption?: string;
  hasError?: boolean;
  help?: ReactNode;
}

interface MockTxtProps extends TextProps {
  children: ReactNode;
  typography?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
}

const createRoomMock = createRoom as jest.MockedFunction<typeof createRoom>;
const deleteRoomMock = deleteRoom as jest.MockedFunction<typeof deleteRoom>;
const getRoomResultMock = getRoomResult as jest.MockedFunction<typeof getRoomResult>;
const listOwnerRoomsMock = listOwnerRooms as jest.MockedFunction<typeof listOwnerRooms>;
const loadOwnerRoomSnapshotsMock = loadOwnerRoomSnapshots as jest.MockedFunction<typeof loadOwnerRoomSnapshots>;
const removeOwnerRoomSnapshotMock = removeOwnerRoomSnapshot as jest.MockedFunction<typeof removeOwnerRoomSnapshot>;
const removeOwnerRoomSnapshotsMock = removeOwnerRoomSnapshots as jest.MockedFunction<typeof removeOwnerRoomSnapshots>;
const rotateInviteMock = rotateInvite as jest.MockedFunction<typeof rotateInvite>;
const saveOwnerRoomSnapshotMock = saveOwnerRoomSnapshot as jest.MockedFunction<typeof saveOwnerRoomSnapshot>;
const shareInviteMock = shareInvite as jest.MockedFunction<typeof shareInvite>;
const fetchAlbumPhotosMock = fetchAlbumPhotos as jest.MockedFunction<typeof fetchAlbumPhotos>;

function renderPage(creatorEntrySource?: 'direct' | 'invite_submitted' | 'invite_already_answered') {
  return render(<Page creatorEntrySource={creatorEntrySource} />);
}

async function completeSurvey(screen: RenderAPI) {
  await screen.findByTestId('display-name-input');
  fireEvent.changeText(screen.getByTestId('display-name-input'), '민준');
  fireEvent.press(screen.getByTestId('start-survey-button'));
  await screen.findByTestId('question-editor');
  fireEvent.press(screen.getByTestId('start-custom-survey-button'));

  for (let index = 0; index < 8; index += 1) {
    fireEvent.press(screen.getByTestId('score-4'));
    await waitFor(() => {
      expect(screen.getByTestId('score-4').props.accessibilityState.selected).toBe(true);
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('next-question-button'));
      await Promise.resolve();
      await Promise.resolve();
    });

    if (index < PERCEPTION_QUESTIONS.length - 1) {
      await screen.findByText(PERCEPTION_QUESTIONS[index + 1] ?? '');
    }
  }
}

describe('perception home screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchAlbumPhotosMock.mockReset();
    loadOwnerRoomSnapshotsMock.mockResolvedValue([]);
    removeOwnerRoomSnapshotMock.mockResolvedValue();
    removeOwnerRoomSnapshotsMock.mockResolvedValue();
    saveOwnerRoomSnapshotMock.mockResolvedValue();
    shareInviteMock.mockResolvedValue();
    listOwnerRoomsMock.mockResolvedValue([]);
    rotateInviteMock.mockResolvedValue({
      inviteToken: 'rotated-token-1',
      expiresAt: '2026-09-10T00:00:00Z',
    });
    createRoomMock.mockResolvedValue({
      roomId: 'room-1',
      inviteToken: 'invite-token-1',
      expiresAt: '2026-09-10T00:00:00Z',
    });
    getRoomResultMock.mockResolvedValue({
      roomId: 'room-1',
      displayName: '민준',
      expiresAt: '2026-09-10T00:00:00Z',
      responseCount: 1,
      requiredCount: 3,
      questions: createDefaultSurveyQuestions(),
      revealed: false,
    });
    deleteRoomMock.mockResolvedValue(true);
  });

  it('continues an invitee into the creator template funnel with matching context', async () => {
    const screen = renderPage('invite_submitted');

    await screen.findByTestId('display-name-input');
    expect(screen.getByText(/이번엔 친구들에게/)).toBeTruthy();
    expect(screen.getByText(/방금 친구에게 답했던 것처럼/)).toBeTruthy();
    expect(screen.getByText('내 친구렌즈 만들기')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('display-name-input'), '서연');
    fireEvent.press(screen.getByTestId('start-survey-button'));

    expect(await screen.findByTestId('question-template-list')).toBeTruthy();
    expect(screen.getByTestId('select-template-friend-chaos')).toBeTruthy();
    expect(screen.getByTestId('start-template-survey-button')).toBeTruthy();
  });

  it('starts immediately with a selected playful question template', async () => {
    const screen = renderPage();

    await screen.findByTestId('display-name-input');
    fireEvent.changeText(screen.getByTestId('display-name-input'), '민준');
    fireEvent.press(screen.getByTestId('start-survey-button'));
    await screen.findByTestId('question-template-list');

    fireEvent.press(screen.getByTestId('select-template-hidden-charm'));
    expect(
      screen.getByTestId('select-template-hidden-charm').props.accessibilityState.selected
    ).toBe(true);
    fireEvent.press(screen.getByTestId('start-template-survey-button'));

    const hiddenCharmQuestions = createQuestionDraftsFromTemplate('hidden-charm');
    expect(await screen.findByText(hiddenCharmQuestions[0]?.prompt ?? '')).toBeTruthy();

    for (let index = 0; index < hiddenCharmQuestions.length; index += 1) {
      fireEvent.press(screen.getByTestId('score-4'));
      fireEvent.press(screen.getByTestId('next-question-button'));
    }

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalledWith(
        '민준',
        hiddenCharmQuestions,
        [4, 4, 4, 4, 4, 4, 4, 4]
      );
    });
  });

  it('saves an edited question and its optional image in the room contract', async () => {
    fetchAlbumPhotosMock.mockResolvedValue([{ id: 'photo-1', dataUri: 'aGVsbG8=' }]);
    const screen = renderPage();

    await screen.findByTestId('display-name-input');
    fireEvent.changeText(screen.getByTestId('display-name-input'), '민준');
    fireEvent.press(screen.getByTestId('start-survey-button'));
    await screen.findByTestId('question-editor');
    fireEvent.changeText(screen.getByTestId('question-input-0'), '친구가 힘들 때 먼저 연락해 주는 편이다');
    fireEvent.press(screen.getByTestId('add-question-image-0'));
    await screen.findByTestId('question-image-0');
    expect(fetchAlbumPhotosMock).toHaveBeenCalledWith({ maxCount: 1, maxWidth: 360, base64: true });
    fireEvent.press(screen.getByTestId('start-custom-survey-button'));

    for (let index = 0; index < 8; index += 1) {
      fireEvent.press(screen.getByTestId('score-4'));
      fireEvent.press(screen.getByTestId('next-question-button'));
    }

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalledWith(
        '민준',
        [
          { prompt: '친구가 힘들 때 먼저 연락해 주는 편이다', imageBase64: 'aGVsbG8=' },
          ...createDefaultQuestionDrafts().slice(1),
        ],
        [4, 4, 4, 4, 4, 4, 4, 4]
      );
    });
  });

  it('keeps text questions usable when photo permission is denied', async () => {
    fetchAlbumPhotosMock.mockRejectedValue(new FetchAlbumPhotosPermissionError());
    const screen = renderPage();

    await screen.findByTestId('display-name-input');
    fireEvent.changeText(screen.getByTestId('display-name-input'), '민준');
    fireEvent.press(screen.getByTestId('start-survey-button'));
    await screen.findByTestId('question-editor');
    fireEvent.press(screen.getByTestId('add-question-image-0'));

    expect(await screen.findByText('질문에 사진을 넣으려면 사진 접근을 허용해 주세요.')).toBeTruthy();
    expect(screen.getByTestId('start-custom-survey-button').props.accessibilityState?.disabled).not.toBe(true);
  });

  it('rejects oversized photos before adding them to a question', async () => {
    fetchAlbumPhotosMock.mockResolvedValue([{ id: 'large-photo', dataUri: 'a'.repeat(400_001) }]);
    const screen = renderPage();

    await screen.findByTestId('display-name-input');
    fireEvent.changeText(screen.getByTestId('display-name-input'), '민준');
    fireEvent.press(screen.getByTestId('start-survey-button'));
    await screen.findByTestId('question-editor');
    fireEvent.press(screen.getByTestId('add-question-image-0'));

    expect(await screen.findByText('사진을 자동으로 줄였지만 아직 용량이 커요. 다른 사진을 골라 주세요.')).toBeTruthy();
    expect(screen.queryByTestId('question-image-0')).toBeNull();
  });

  it('limits a room to three question images', async () => {
    fetchAlbumPhotosMock.mockResolvedValue([{ id: 'photo', dataUri: 'aGVsbG8=' }]);
    const screen = renderPage();

    await screen.findByTestId('display-name-input');
    fireEvent.changeText(screen.getByTestId('display-name-input'), '민준');
    fireEvent.press(screen.getByTestId('start-survey-button'));
    await screen.findByTestId('question-editor');

    for (let index = 0; index < 3; index += 1) {
      fireEvent.press(screen.getByTestId(`add-question-image-${index}`));
      await screen.findByTestId(`question-image-${index}`);
    }
    fireEvent.press(screen.getByTestId('add-question-image-3'));

    expect(await screen.findByText('이미지는 최대 3장까지 넣을 수 있어요.')).toBeTruthy();
    expect(fetchAlbumPhotosMock).toHaveBeenCalledTimes(3);
  });

  it('keeps prior rooms in the recent-30-day list after creating a new room and deletes only the selected room', async () => {
    listOwnerRoomsMock.mockResolvedValue([
      {
        roomId: 'old-room',
        displayName: '서연',
        createdAt: '2026-08-10T00:00:00Z',
        expiresAt: '2026-09-09T00:00:00Z',
        responseCount: 2,
        requiredCount: 3,
        revealed: false,
      },
    ]);

    const screen = renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('history-list')).toBeTruthy();
      expect(screen.getByTestId('open-history-room-old-room')).toBeTruthy();
    });

    await completeSurvey(screen);

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalledWith(
        '민준',
        createDefaultQuestionDrafts(),
        [4, 4, 4, 4, 4, 4, 4, 4]
      );
      expect(screen.getByText('친구렌즈가 준비됐어요')).toBeTruthy();
      expect(saveOwnerRoomSnapshotMock).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: '민준',
          room: {
            roomId: 'room-1',
            inviteToken: 'invite-token-1',
            expiresAt: '2026-09-10T00:00:00Z',
          },
          createdAt: expect.any(String),
        })
      );
    });

    fireEvent.press(screen.getByTestId('refresh-result-button'));

    await waitFor(() => {
      expect(getRoomResultMock).toHaveBeenCalledWith('room-1');
      expect(screen.getByTestId('response-count').props.children.join('')).toBe('1 / 3명');
    });

    await waitFor(() => {
      expect(screen.getByTestId('share-invite-button').props.accessibilityState?.disabled).not.toBe(true);
    });
    fireEvent.press(screen.getByTestId('share-invite-button'));

    await waitFor(() => {
      expect(shareInviteMock).toHaveBeenCalledWith('민준', 'invite-token-1');
      expect(screen.getByTestId('delete-room-button').props.accessibilityState?.disabled).not.toBe(true);
    });

    fireEvent.press(screen.getByTestId('back-to-history-button'));

    await waitFor(() => {
      expect(screen.getByTestId('history-list')).toBeTruthy();
      expect(screen.getByTestId('open-history-room-old-room')).toBeTruthy();
      expect(screen.getByTestId('open-history-room-room-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('open-history-room-room-1'));

    await waitFor(() => {
      expect(screen.getByText('친구렌즈가 준비됐어요')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('delete-room-button'));

    await waitFor(() => {
      expect(deleteRoomMock).toHaveBeenCalledWith('room-1');
      expect(removeOwnerRoomSnapshotMock).toHaveBeenCalledWith('room-1');
      expect(screen.getByText('새 친구렌즈 만들기')).toBeTruthy();
      expect(screen.getByTestId('open-history-room-old-room')).toBeTruthy();
      expect(screen.queryByTestId('open-history-room-room-1')).toBeNull();
    });
  });

  it('keeps the survey retryable when the Supabase connection fails', async () => {
    createRoomMock.mockRejectedValue(new Error('Network request failed'));
    const screen = renderPage();

    await completeSurvey(screen);

    await waitFor(() => {
      expect(screen.getByText('인터넷 연결을 확인하고 다시 시도해 주세요.')).toBeTruthy();
      expect(screen.getByText('방 만들기')).toBeTruthy();
    });
  });

  it('shows an unexpired saved room in history without opening it automatically', async () => {
    loadOwnerRoomSnapshotsMock.mockResolvedValue([
      {
        displayName: '민준',
        room: {
          roomId: 'room-1',
          inviteToken: 'invite-token-1',
          expiresAt: '2026-09-10T00:00:00Z',
        },
        createdAt: '2026-08-11T00:00:00Z',
      },
    ]);
    listOwnerRoomsMock.mockResolvedValue([
      {
        roomId: 'room-1',
        displayName: '민준',
        createdAt: '2026-08-11T00:00:00Z',
        expiresAt: '2026-09-10T00:00:00Z',
        responseCount: 1,
        requiredCount: 3,
        revealed: false,
      },
    ]);

    const screen = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('history-list')).toBeTruthy();
      expect(screen.getByTestId('open-history-room-room-1')).toBeTruthy();
      expect(screen.queryByText('친구렌즈가 준비됐어요')).toBeNull();
      expect(screen.getByTestId('display-name-input').props.value).toBe('민준');
    });
  });

  it('rotates and saves a fresh invite token before sharing a cross-device room that has no local token', async () => {
    listOwnerRoomsMock.mockResolvedValue([
      {
        roomId: 'remote-room',
        displayName: '민준',
        createdAt: '2026-08-12T00:00:00Z',
        expiresAt: '2026-09-10T00:00:00Z',
        responseCount: 2,
        requiredCount: 3,
        revealed: false,
      },
    ]);
    getRoomResultMock.mockResolvedValue({
      roomId: 'remote-room',
      displayName: '민준',
      expiresAt: '2026-09-10T00:00:00Z',
      responseCount: 2,
      requiredCount: 3,
      questions: createDefaultSurveyQuestions(),
      revealed: false,
    });

    const screen = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('open-history-room-remote-room')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('open-history-room-remote-room'));

    await waitFor(() => {
      expect(screen.getByText('친구렌즈가 준비됐어요')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('share-invite-button'));

    await waitFor(() => {
      expect(rotateInviteMock).toHaveBeenCalledWith('remote-room');
      expect(saveOwnerRoomSnapshotMock).toHaveBeenCalledWith({
        displayName: '민준',
        room: {
          roomId: 'remote-room',
          inviteToken: 'rotated-token-1',
          expiresAt: '2026-09-10T00:00:00Z',
        },
      });
      expect(shareInviteMock).toHaveBeenCalledWith('민준', 'rotated-token-1');
    });
  });

  it('removes all stale local rooms in one batch during restore', async () => {
    loadOwnerRoomSnapshotsMock.mockResolvedValue([
      {
        displayName: '민준',
        room: { roomId: 'stale-1', inviteToken: 'token-1', expiresAt: '2026-09-10T00:00:00Z' },
      },
      {
        displayName: '서연',
        room: { roomId: 'stale-2', inviteToken: 'token-2', expiresAt: '2026-09-11T00:00:00Z' },
      },
    ]);
    getRoomResultMock.mockResolvedValue(null);

    const screen = renderPage();

    await waitFor(() => {
      expect(removeOwnerRoomSnapshotsMock).toHaveBeenCalledWith(['stale-1', 'stale-2']);
      expect(screen.getByTestId('history-empty')).toBeTruthy();
    });
  });

  it('returns to history when refresh discovers that the active room expired', async () => {
    const screen = renderPage();
    await completeSurvey(screen);

    await screen.findByText('친구렌즈가 준비됐어요');
    getRoomResultMock.mockResolvedValueOnce(null);
    fireEvent.press(screen.getByTestId('refresh-result-button'));

    await waitFor(() => {
      expect(removeOwnerRoomSnapshotMock).toHaveBeenCalledWith('room-1');
      expect(screen.queryByText('친구렌즈가 준비됐어요')).toBeNull();
      expect(screen.getByTestId('history-error')).toBeTruthy();
      expect(screen.getByText('삭제되었거나 만료된 방은 최근 30일 기록에서 제외했어요.')).toBeTruthy();
    });
  });

  it('keeps expired-room recovery working when local snapshot cleanup fails', async () => {
    const screen = renderPage();
    await completeSurvey(screen);

    await screen.findByText('친구렌즈가 준비됐어요');
    getRoomResultMock.mockResolvedValueOnce(null);
    removeOwnerRoomSnapshotMock.mockRejectedValueOnce(new Error('local storage failed'));
    fireEvent.press(screen.getByTestId('refresh-result-button'));

    await waitFor(() => {
      expect(screen.queryByText('친구렌즈가 준비됐어요')).toBeNull();
      expect(screen.getByText('삭제되었거나 만료된 방은 최근 30일 기록에서 제외했어요.')).toBeTruthy();
      expect(screen.queryByText('응답 현황을 불러오지 못했어요. 다시 시도해 주세요.')).toBeNull();
    });
  });
});
