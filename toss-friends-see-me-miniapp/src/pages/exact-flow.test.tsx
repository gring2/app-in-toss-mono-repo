jest.mock('../lib/supabase/perception-api', () => ({
  createRoom: jest.fn(),
  deleteRoom: jest.fn(),
  getInvite: jest.fn(),
  getRoomResult: jest.fn(),
  listOwnerRooms: jest.fn(),
  rotateInvite: jest.fn(),
  submitFriendResponse: jest.fn(),
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
  createDefaultSurveyQuestions,
  PERCEPTION_QUESTIONS,
} from '../features/perception/questions';
import { shareInvite } from '../features/perception/share-invite';
import {
  createRoom,
  getInvite,
  getRoomResult,
  listOwnerRooms,
  rotateInvite,
  submitFriendResponse,
} from '../lib/supabase/perception-api';
import { Page } from './index';
import { InviteContent } from './invite';

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
const getInviteMock = getInvite as jest.MockedFunction<typeof getInvite>;
const getRoomResultMock = getRoomResult as jest.MockedFunction<typeof getRoomResult>;
const listOwnerRoomsMock = listOwnerRooms as jest.MockedFunction<typeof listOwnerRooms>;
const loadOwnerRoomSnapshotsMock = loadOwnerRoomSnapshots as jest.MockedFunction<typeof loadOwnerRoomSnapshots>;
const submitFriendResponseMock = submitFriendResponse as jest.MockedFunction<typeof submitFriendResponse>;
const removeOwnerRoomSnapshotMock = removeOwnerRoomSnapshot as jest.MockedFunction<typeof removeOwnerRoomSnapshot>;
const removeOwnerRoomSnapshotsMock = removeOwnerRoomSnapshots as jest.MockedFunction<typeof removeOwnerRoomSnapshots>;
const rotateInviteMock = rotateInvite as jest.MockedFunction<typeof rotateInvite>;
const saveOwnerRoomSnapshotMock = saveOwnerRoomSnapshot as jest.MockedFunction<typeof saveOwnerRoomSnapshot>;
const shareInviteMock = shareInvite as jest.MockedFunction<typeof shareInvite>;

async function answerSurvey(screen: RenderAPI, score: 4 | 5) {
  for (let index = 0; index < PERCEPTION_QUESTIONS.length; index += 1) {
    fireEvent.press(screen.getByTestId(`score-${score}`));
    await waitFor(() => {
      expect(screen.getByTestId(`score-${score}`).props.accessibilityState.selected).toBe(true);
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

describe('named exact product flow', () => {
  it('creates, shares, collects three anonymous responses, and reveals aggregate comparison only', async () => {
    let responseCount = 0;
    loadOwnerRoomSnapshotsMock.mockResolvedValue([]);
    removeOwnerRoomSnapshotMock.mockResolvedValue();
    removeOwnerRoomSnapshotsMock.mockResolvedValue();
    saveOwnerRoomSnapshotMock.mockResolvedValue();
    shareInviteMock.mockResolvedValue();
    listOwnerRoomsMock.mockResolvedValue([]);
    rotateInviteMock.mockResolvedValue({
      inviteToken: 'token-exact-rotated',
      expiresAt: '2026-09-10T00:00:00Z',
    });
    createRoomMock.mockResolvedValue({
      roomId: 'room-exact',
      inviteToken: 'token-exact',
      expiresAt: '2026-09-10T00:00:00Z',
    });
    getInviteMock.mockImplementation(async () => ({
      roomId: 'room-exact',
      displayName: '민준',
      expiresAt: '2026-09-10T00:00:00Z',
      responseCount,
      questionCount: 8,
      questions: createDefaultSurveyQuestions(),
      alreadyAnswered: false,
      isOwner: false,
    }));
    submitFriendResponseMock.mockImplementation(async () => {
      responseCount += 1;
      return {
        roomId: 'room-exact',
        responseCount,
        requiredCount: 3,
        revealed: responseCount >= 3,
      };
    });
    getRoomResultMock.mockImplementation(async () =>
      responseCount < 3
        ? {
            roomId: 'room-exact',
            displayName: '민준',
            expiresAt: '2026-09-10T00:00:00Z',
            responseCount,
            requiredCount: 3,
            questions: createDefaultSurveyQuestions(),
            revealed: false,
          }
        : {
            roomId: 'room-exact',
            displayName: '민준',
            expiresAt: '2026-09-10T00:00:00Z',
            responseCount,
            requiredCount: 3,
            questions: createDefaultSurveyQuestions(),
            revealed: true,
            selfAnswers: [4, 4, 4, 4, 4, 4, 4, 4],
            friendAverages: [5, 5, 5, 5, 5, 5, 5, 5],
          }
    );

    const owner = render(<Page />);
    await owner.findByTestId('display-name-input');
    fireEvent.changeText(owner.getByTestId('display-name-input'), '민준');
    fireEvent.press(owner.getByTestId('start-survey-button'));
    await owner.findByTestId('question-editor');
    fireEvent.press(owner.getByTestId('start-custom-survey-button'));
    await answerSurvey(owner, 4);

    await owner.findByText('친구렌즈가 준비됐어요');
    expect(owner.queryByTestId('revealed-result')).toBeNull();
    await act(async () => {
      fireEvent.press(owner.getByTestId('share-invite-button'));
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(shareInviteMock).toHaveBeenCalledWith('민준', 'token-exact'));
    owner.unmount();
    loadOwnerRoomSnapshotsMock.mockResolvedValue([
      {
        displayName: '민준',
        room: {
          roomId: 'room-exact',
          inviteToken: 'token-exact',
          expiresAt: '2026-09-10T00:00:00Z',
        },
        createdAt: '2026-08-11T00:00:00Z',
      },
    ]);
    let restoredOwner: RenderAPI | null = null;

    for (let friendNumber = 1; friendNumber <= 3; friendNumber += 1) {
      listOwnerRoomsMock.mockResolvedValue([
        {
          roomId: 'room-exact',
          displayName: '민준',
          createdAt: '2026-08-11T00:00:00Z',
          expiresAt: '2026-09-10T00:00:00Z',
          responseCount,
          requiredCount: 3,
          revealed: responseCount >= 3,
        },
      ]);
      const friend = render(<InviteContent token="token-exact" onGoHome={jest.fn()} />);
      await friend.findByTestId('invite-intro');
      fireEvent.press(friend.getByTestId('start-friend-survey-button'));
      await answerSurvey(friend, 5);
      await friend.findByTestId('invite-submitted');
      friend.unmount();

      expect(responseCount).toBe(friendNumber);
      restoredOwner = render(<Page />);
      await restoredOwner.findByTestId('open-history-room-room-exact');
      fireEvent.press(restoredOwner.getByTestId('open-history-room-room-exact'));
      await waitFor(() => {
        expect(getRoomResultMock).toHaveBeenCalledTimes(friendNumber);
        expect(restoredOwner?.getByTestId('response-count').props.children.join('')).toBe(`${friendNumber} / 3명`);
      });

      if (friendNumber < 3) {
        expect(restoredOwner.queryByTestId('revealed-result')).toBeNull();
        restoredOwner.unmount();
      }
    }

    expect(restoredOwner?.getByTestId('revealed-result')).toBeTruthy();
    expect(restoredOwner?.getAllByText('나 4.0 · 친구 5.0')).toHaveLength(8);
    expect(restoredOwner?.queryByText(/친구 1|친구 2|친구 3/)).toBeNull();
    expect(submitFriendResponseMock).toHaveBeenCalledTimes(3);
  });
});
