jest.mock('../lib/supabase/perception-api', () => ({
  getInvite: jest.fn(),
  submitFriendResponse: jest.fn(),
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
    Txt: ({ children, ...props }: MockTxtProps) => ReactModule.createElement(ReactNative.Text, props, children),
  };
});

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import React from 'react';
import type { PressableProps, TextProps, ViewProps } from 'react-native';
import { getInvite, submitFriendResponse } from '../lib/supabase/perception-api';
import { createDefaultSurveyQuestions } from '../features/perception/questions';
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

interface MockTxtProps extends TextProps {
  children: ReactNode;
  typography?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
}

const getInviteMock = getInvite as jest.MockedFunction<typeof getInvite>;
const submitFriendResponseMock = submitFriendResponse as jest.MockedFunction<typeof submitFriendResponse>;

const validInvite = {
  roomId: 'room-1',
  displayName: '민준',
  expiresAt: '2026-09-10T00:00:00Z',
  responseCount: 0,
  questionCount: 8,
  questions: createDefaultSurveyQuestions(),
  alreadyAnswered: false,
  isOwner: false,
};

describe('friend invite screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getInviteMock.mockResolvedValue(validInvite);
    submitFriendResponseMock.mockResolvedValue({
      roomId: 'room-1',
      responseCount: 1,
      requiredCount: 3,
      revealed: false,
    });
  });

  it('loads an invite and submits eight anonymous friend answers', async () => {
    const onStartCreator = jest.fn();
    const screen = render(
      <InviteContent
        token="token-1"
        onGoHome={jest.fn()}
        onStartCreator={onStartCreator}
      />
    );

    await screen.findByTestId('invite-intro');
    expect(getInviteMock).toHaveBeenCalledWith('token-1');
    expect(screen.getByText(/나의 MBTI나 성격/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('start-friend-survey-button'));
    expect(screen.getByText('답변 대상 · 민준님')).toBeTruthy();
    expect(screen.getByText('반응을 골라 주세요')).toBeTruthy();
    expect(screen.getByTestId('survey-scroll')).toBeTruthy();
    expect(screen.getByTestId('survey-bottom-actions')).toBeTruthy();
    expect(screen.getByTestId('survey-scroll').findAllByProps({ testID: 'survey-bottom-actions' })).toHaveLength(0);

    for (let index = 0; index < 8; index += 1) {
      fireEvent.press(screen.getByTestId('score-5'));
      fireEvent.press(screen.getByTestId('next-question-button'));
    }

    await waitFor(() => {
      expect(submitFriendResponseMock).toHaveBeenCalledWith('token-1', [5, 5, 5, 5, 5, 5, 5, 5]);
      expect(screen.getByTestId('invite-submitted')).toBeTruthy();
      expect(screen.getByText('1명의 답변이 모였어요. 누가 어떤 답을 했는지는 공개되지 않아요.')).toBeTruthy();
      expect(screen.getByText('나도 친구들에게 물어볼까요?')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('invite-creator-cta'));
    expect(onStartCreator).toHaveBeenCalledWith('invite_submitted');
  });

  it('shows a safe error and lets the user retry an invalid invite', async () => {
    getInviteMock.mockResolvedValue(null);
    const screen = render(<InviteContent token="expired" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-error');
    fireEvent.press(screen.getByTestId('invite-error-primary'));

    await waitFor(() => {
      expect(getInviteMock).toHaveBeenCalledTimes(2);
    });
  });

  it('lets an invalid-link user return home from the secondary action', async () => {
    getInviteMock.mockResolvedValue(null);
    const onGoHome = jest.fn();
    const screen = render(<InviteContent token="expired" onGoHome={onGoHome} />);

    await screen.findByTestId('invite-error');
    fireEvent.press(screen.getByText('나도 친구렌즈 만들기'));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('rejects a blank token without calling the invite API', async () => {
    const screen = render(<InviteContent token="" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-error');
    expect(screen.getByText('초대 링크가 올바르지 않아요.')).toBeTruthy();
    expect(getInviteMock).not.toHaveBeenCalled();
  });

  it('shows the network message when loading an invite fails', async () => {
    getInviteMock.mockRejectedValue(new Error('Network request failed'));
    const screen = render(<InviteContent token="token-1" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-error');
    expect(screen.getByText('인터넷 연결을 확인하고 다시 시도해 주세요.')).toBeTruthy();
  });

  it('renders the room owner, custom prompt, and optional prompt image together', async () => {
    const longPrompt = '처음 보는 사람만 가득한 아주 낯선 모임에서도 먼저 다가가 자연스럽게 말을 걸고 어색한 분위기를 금방 풀어낼 것 같다'.slice(0, 60);
    getInviteMock.mockResolvedValue({
      ...validInvite,
      questions: [
        { prompt: longPrompt, imageUri: 'data:image/jpeg;base64,aGVsbG8=' },
        ...createDefaultSurveyQuestions().slice(1),
      ],
    });
    const screen = render(<InviteContent token="token-1" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-intro');
    fireEvent.press(screen.getByTestId('start-friend-survey-button'));

    expect(screen.getByText('답변 대상 · 민준님')).toBeTruthy();
    expect(screen.getByText(longPrompt)).toBeTruthy();
    expect(screen.getByTestId('survey-question-image')).toBeTruthy();
    expect(screen.getByTestId('survey-scroll').findAllByProps({ testID: 'survey-bottom-actions' })).toHaveLength(0);
  });

  it('keeps the selected survey state when submission fails on the network', async () => {
    submitFriendResponseMock.mockRejectedValue(new Error('Failed to fetch'));
    const screen = render(<InviteContent token="token-1" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-intro');
    fireEvent.press(screen.getByTestId('start-friend-survey-button'));
    for (let index = 0; index < 8; index += 1) {
      fireEvent.press(screen.getByTestId('score-5'));
      fireEvent.press(screen.getByTestId('next-question-button'));
    }

    await screen.findByText('인터넷 연결을 확인하고 다시 시도해 주세요.');
    expect(screen.getByTestId('score-5').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('next-question-button')).toBeTruthy();
  });

  it('prevents the room owner from answering through their own link', async () => {
    getInviteMock.mockResolvedValue({ ...validInvite, isOwner: true });
    const onGoHome = jest.fn();
    const screen = render(<InviteContent token="token-1" onGoHome={onGoHome} />);

    await screen.findByTestId('invite-owner');
    expect(screen.queryByTestId('start-friend-survey-button')).toBeNull();
    fireEvent.press(screen.getByTestId('invite-owner-primary'));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('does not expose the survey after this user already answered', async () => {
    getInviteMock.mockResolvedValue({ ...validInvite, alreadyAnswered: true });
    const onGoHome = jest.fn();
    const onStartCreator = jest.fn();
    const screen = render(
      <InviteContent
        token="token-1"
        onGoHome={onGoHome}
        onStartCreator={onStartCreator}
      />
    );

    await screen.findByTestId('invite-already-answered');
    expect(screen.queryByTestId('start-friend-survey-button')).toBeNull();
    fireEvent.press(screen.getByTestId('invite-already-answered-primary'));
    expect(onStartCreator).toHaveBeenCalledWith('invite_already_answered');
    expect(onGoHome).not.toHaveBeenCalled();
  });

  it('resets submitted state when the route receives a different invite token', async () => {
    getInviteMock.mockImplementation(async (token) => ({
      ...validInvite,
      roomId: token,
      displayName: token === 'token-2' ? '서연' : '민준',
    }));
    const screen = render(<InviteContent token="token-1" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-intro');
    fireEvent.press(screen.getByTestId('start-friend-survey-button'));
    for (let index = 0; index < 8; index += 1) {
      fireEvent.press(screen.getByTestId('score-5'));
      fireEvent.press(screen.getByTestId('next-question-button'));
    }
    await screen.findByTestId('invite-submitted');

    screen.rerender(<InviteContent token="token-2" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-intro');
    expect(screen.getByText(/서연님을 떠올리며/)).toBeTruthy();
    expect(screen.queryByTestId('invite-submitted')).toBeNull();
  });

  it('ignores a stale submission that resolves after the invite token changes', async () => {
    let finishSubmission: ((value: Awaited<ReturnType<typeof submitFriendResponse>>) => void) | undefined;
    submitFriendResponseMock.mockImplementation(
      async () => new Promise((resolve) => {
        finishSubmission = resolve;
      })
    );
    getInviteMock.mockImplementation(async (token) => ({
      ...validInvite,
      roomId: token,
      displayName: token === 'token-2' ? '서연' : '민준',
    }));
    const screen = render(<InviteContent token="token-1" onGoHome={jest.fn()} />);

    await screen.findByTestId('invite-intro');
    fireEvent.press(screen.getByTestId('start-friend-survey-button'));
    for (let index = 0; index < 8; index += 1) {
      fireEvent.press(screen.getByTestId('score-5'));
      fireEvent.press(screen.getByTestId('next-question-button'));
    }
    await waitFor(() => expect(submitFriendResponseMock).toHaveBeenCalledTimes(1));

    screen.rerender(<InviteContent token="token-2" onGoHome={jest.fn()} />);
    await screen.findByTestId('invite-intro');

    await act(async () => {
      finishSubmission?.({
        roomId: 'token-1',
        responseCount: 1,
        requiredCount: 3,
        revealed: false,
      });
      await Promise.resolve();
    });

    expect(screen.getByText(/서연님을 떠올리며/)).toBeTruthy();
    expect(screen.queryByTestId('invite-submitted')).toBeNull();
  });
});
