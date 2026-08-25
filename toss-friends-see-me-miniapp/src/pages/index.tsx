import { Analytics } from '@apps-in-toss/framework';
import { createRoute } from '@granite-js/react-native';
import { Txt } from '@toss/tds-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  draftsToSurveyQuestions,
  loadHistoryItems,
  type ActiveRoom,
  type OwnerRoomHistoryItem,
  updateHistoryItemWithResult,
  upsertHistoryItem,
} from '../features/perception/owner-room-history';
import { getOwnerFlowErrorMessage } from '../features/perception/error-messages';
import { PerceptionSurvey } from '../features/perception/PerceptionSurvey';
import { OwnerIntroStep } from '../features/perception/OwnerIntroStep';
import {
  OwnerRoomStep,
  type OwnerRoomOperation,
} from '../features/perception/OwnerRoomStep';
import { QuestionEditor } from '../features/perception/QuestionEditor';
import {
  loadOwnerRoomSnapshots,
  removeOwnerRoomSnapshot,
  saveOwnerRoomSnapshot,
} from '../features/perception/owner-room-storage';
import {
  createQuestionDraftsFromTemplate,
  createDefaultQuestionDrafts,
  DEFAULT_TEMPLATE_ID,
  type QuestionDraft,
  type QuestionTemplateId,
} from '../features/perception/questions';
import { shareInvite } from '../features/perception/share-invite';
import {
  createRoom,
  deleteRoom,
  getRoomResult,
  rotateInvite,
  type AnswerScore,
  type PerceptionResult,
} from '../lib/supabase/perception-api';

const REQUIRED_FRIENDS = 3;

export type CreatorEntrySource = 'direct' | 'invite_submitted' | 'invite_already_answered';

interface HomeRouteParams {
  source?: CreatorEntrySource;
}

function parseHomeParams(params: Readonly<object | undefined>): HomeRouteParams | undefined {
  const source = (params as { source?: unknown } | undefined)?.source;
  if (source === 'invite_submitted' || source === 'invite_already_answered') {
    return { source };
  }

  return undefined;
}

export const Route = createRoute('/', {
  validateParams: parseHomeParams,
  component: RoutedPage,
});

type Step = 'intro' | 'compose' | 'survey' | 'room';
type RoomEntrySource = 'created' | 'history';

function RoutedPage() {
  const params = Route.useParams();
  return <Page creatorEntrySource={params?.source} />;
}

export function Page({
  creatorEntrySource = 'direct',
}: {
  creatorEntrySource?: CreatorEntrySource;
}) {
  const [step, setStep] = useState<Step>('intro');
  const [activeCreatorEntrySource, setActiveCreatorEntrySource] =
    useState<CreatorEntrySource>(creatorEntrySource);
  const [displayName, setDisplayName] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>(createDefaultQuestionDrafts);
  const [selectedTemplateId, setSelectedTemplateId] = useState<QuestionTemplateId | null>(
    DEFAULT_TEMPLATE_ID
  );
  const [room, setRoom] = useState<ActiveRoom | null>(null);
  const [roomEntrySource, setRoomEntrySource] = useState<RoomEntrySource | null>(null);
  const [result, setResult] = useState<PerceptionResult | null>(null);
  const [historyItems, setHistoryItems] = useState<OwnerRoomHistoryItem[]>([]);
  const [operation, setOperation] = useState<OwnerRoomOperation>(null);
  const [restoring, setRestoring] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyErrorMessage, setHistoryErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveCreatorEntrySource(creatorEntrySource);
  }, [creatorEntrySource]);

  const resetActiveRoom = (): void => {
    setRoom(null);
    setResult(null);
    setRoomEntrySource(null);
  };

  const removeMissingRoomHistory = async (roomId: string): Promise<void> => {
    setHistoryItems((current) => current.filter((item) => item.roomId !== roomId));
    try {
      await removeOwnerRoomSnapshot(roomId);
    } catch {
      // The server already confirmed this room is gone; local cleanup is best-effort.
    }
  };

  const syncHistoryItemResult = (
    roomId: string,
    nextResult: PerceptionResult,
    fallbackDisplayName: string
  ): void => {
    setHistoryItems((current) =>
      current.map((item) =>
        item.roomId === roomId
          ? updateHistoryItemWithResult(item, nextResult, fallbackDisplayName)
          : item
      )
    );
  };

  useEffect(() => {
    let active = true;

    async function restoreRoomAndHistory() {
      try {
        const snapshots = await loadOwnerRoomSnapshots();
        const nextHistoryItems = await loadHistoryItems(snapshots);
        if (!active) {
          return;
        }

        setHistoryItems(nextHistoryItems);
        setHistoryErrorMessage(null);
        if (nextHistoryItems[0] != null) {
          setDisplayName(nextHistoryItems[0].displayName);
        }
      } catch (error) {
        if (active) {
          const message = getOwnerFlowErrorMessage(error, '최근 30일 방 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
          setHistoryErrorMessage(message);
          setErrorMessage(message);
        }
      } finally {
        if (active) {
          setRestoring(false);
        }
      }
    }

    void restoreRoomAndHistory();
    return () => {
      active = false;
    };
  }, []);

  const startSurvey = () => {
    if (displayName.trim().length === 0) {
      setErrorMessage('친구들이 알아볼 이름을 입력해 주세요.');
      return;
    }

    setErrorMessage(null);
    setStep('compose');
  };

  const createOwnerRoom = async (answers: readonly AnswerScore[]) => {
    setOperation('creating');
    setErrorMessage(null);

    try {
      const trimmedName = displayName.trim();
      const createdRoom = await createRoom(trimmedName, questions, answers);
      const createdAt = new Date().toISOString();
      setRoom(createdRoom);
      setRoomEntrySource('created');
      setResult({
        roomId: createdRoom.roomId,
        responseCount: 0,
        requiredCount: REQUIRED_FRIENDS,
        questions: draftsToSurveyQuestions(questions),
        revealed: false,
      });
      setStep('room');
      setHistoryItems((current) =>
        upsertHistoryItem(current, {
          roomId: createdRoom.roomId,
          displayName: trimmedName,
          createdAt,
          expiresAt: createdRoom.expiresAt,
          responseCount: 0,
          requiredCount: REQUIRED_FRIENDS,
          revealed: false,
          inviteToken: createdRoom.inviteToken,
        })
      );
      setHistoryErrorMessage(null);

      try {
        await saveOwnerRoomSnapshot({ displayName: trimmedName, room: createdRoom, createdAt });
      } catch {
        setErrorMessage('방은 만들어졌지만 이 기기에서 자동으로 다시 불러오지 못할 수 있어요.');
      }
    } catch (error) {
      setErrorMessage(getOwnerFlowErrorMessage(error, '방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setOperation(null);
    }
  };

  const refreshResult = async () => {
    if (room == null) {
      return;
    }

    setOperation('refreshing');
    setErrorMessage(null);

    try {
      const nextResult = await getRoomResult(room.roomId);
      if (nextResult == null) {
        const missingRoomMessage = '삭제되었거나 만료된 방은 최근 30일 기록에서 제외했어요.';
        await removeMissingRoomHistory(room.roomId);
        resetActiveRoom();
        setStep('intro');
        setErrorMessage(null);
        setHistoryErrorMessage(missingRoomMessage);
        return;
      }

      setResult(nextResult);
      setRoom((current) =>
        current == null
          ? current
          : {
              ...current,
              expiresAt: nextResult.expiresAt ?? current.expiresAt,
            }
      );
      syncHistoryItemResult(room.roomId, nextResult, displayName.trim());
    } catch (error) {
      setErrorMessage(getOwnerFlowErrorMessage(error, '응답 현황을 불러오지 못했어요. 다시 시도해 주세요.'));
    } finally {
      setOperation(null);
    }
  };

  const shareRoom = async () => {
    if (room == null) {
      return;
    }

    setErrorMessage(null);
    let nextRoom = room;
    const roomName = displayName.trim();
    let saveWarningMessage: string | null = null;

    if (nextRoom.inviteToken == null || nextRoom.inviteToken.length === 0) {
      setOperation('rotating');

      try {
        const rotatedRoom = await rotateInvite(nextRoom.roomId);
        nextRoom = {
          roomId: nextRoom.roomId,
          inviteToken: rotatedRoom.inviteToken,
          expiresAt: rotatedRoom.expiresAt,
        };

        setRoom(nextRoom);
        setHistoryItems((current) =>
          current.map((item) =>
            item.roomId === nextRoom.roomId
              ? {
                  ...item,
                  inviteToken: rotatedRoom.inviteToken,
                  expiresAt: rotatedRoom.expiresAt,
                }
              : item
          )
        );

        try {
          await saveOwnerRoomSnapshot({
            displayName: roomName,
            room: {
              roomId: nextRoom.roomId,
              inviteToken: rotatedRoom.inviteToken,
              expiresAt: rotatedRoom.expiresAt,
            },
          });
        } catch {
          saveWarningMessage = '새 초대 링크는 만들었지만 이 기기에 다시 저장하지는 못했어요.';
        }
      } catch (error) {
        setErrorMessage(getOwnerFlowErrorMessage(error, '초대 링크를 다시 만들지 못했어요. 잠시 후 다시 시도해 주세요.'));
        setOperation(null);
        return;
      }
    }

    if (nextRoom.inviteToken == null) {
      setErrorMessage('초대 링크를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setOperation(null);
      return;
    }

    setOperation('sharing');

    try {
      await shareInvite(roomName, nextRoom.inviteToken);
      if (saveWarningMessage != null) {
        setErrorMessage(saveWarningMessage);
      }
    } catch (error) {
      setErrorMessage(getOwnerFlowErrorMessage(error, '공유창을 열지 못했어요. 다시 시도해 주세요.'));
    } finally {
      setOperation(null);
    }
  };

  const removeRoom = async () => {
    if (room == null) {
      return;
    }

    setOperation('deleting');
    setErrorMessage(null);

    try {
      await deleteRoom(room.roomId);
      try {
        await removeOwnerRoomSnapshot(room.roomId);
      } catch {
        // The server deletion succeeded; stale local recovery data is harmless.
      }
      setHistoryItems((current) => current.filter((item) => item.roomId !== room.roomId));
      resetFlow();
    } catch (error) {
      setErrorMessage(getOwnerFlowErrorMessage(error, '방을 삭제하지 못했어요. 다시 시도해 주세요.'));
    } finally {
      setOperation(null);
    }
  };

  const openHistoryRoom = async (historyItem: OwnerRoomHistoryItem) => {
    setOperation('opening');
    setErrorMessage(null);
    setHistoryErrorMessage(null);

    try {
      const nextResult = await getRoomResult(historyItem.roomId);
      if (nextResult == null) {
        await removeMissingRoomHistory(historyItem.roomId);
        setHistoryErrorMessage('삭제되었거나 만료된 방은 최근 30일 기록에서 제외했어요.');
        return;
      }

      setDisplayName(historyItem.displayName);
      setRoom({
        roomId: historyItem.roomId,
        inviteToken: historyItem.inviteToken,
        expiresAt: nextResult.expiresAt ?? historyItem.expiresAt,
      });
      setRoomEntrySource('history');
      setResult(nextResult);
      setStep('room');
      syncHistoryItemResult(historyItem.roomId, nextResult, historyItem.displayName);
    } catch (error) {
      setHistoryErrorMessage(getOwnerFlowErrorMessage(error, '방을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setOperation(null);
    }
  };

  const returnToHistory = () => {
    setStep('intro');
    setActiveCreatorEntrySource('direct');
    resetActiveRoom();
    setOperation(null);
    setErrorMessage(null);
  };

  const resetFlow = () => {
    setStep('intro');
    setDisplayName('');
    setQuestions(createDefaultQuestionDrafts());
    setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
    setActiveCreatorEntrySource('direct');
    resetActiveRoom();
    setErrorMessage(null);
  };

  if (restoring) {
    return (
      <View style={styles.centeredState} testID="restoring-room">
        <Txt typography="t5" color="#6B7684">
          이전 방을 확인하고 있어요…
        </Txt>
      </View>
    );
  }

  if (step === 'survey') {
    return (
      <Analytics.Impression
        impression="on-mount"
        style={styles.fullScreenImpression}
        params={{
          log_name: 'owner_self_survey_view',
          funnel: 'owner_create',
          funnel_step: 3,
          creator_entry_source: activeCreatorEntrySource,
          template_id: selectedTemplateId ?? 'custom',
        }}
      >
        <PerceptionSurvey
          questions={draftsToSurveyQuestions(questions)}
          subjectName={displayName.trim()}
          perspective="self"
          submitLabel="방 만들기"
          loading={operation === 'creating'}
          errorMessage={errorMessage}
          onComplete={(answers) => void createOwnerRoom(answers)}
          onExit={() => setStep('compose')}
        />
      </Analytics.Impression>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID="perception-home"
    >
      {step === 'intro' ? (
        <Analytics.Impression
          impression="on-mount"
          params={{
            log_name: 'owner_intro_view',
            funnel: 'owner_create',
            funnel_step: 1,
            creator_entry_source: activeCreatorEntrySource,
          }}
        >
          <OwnerIntroStep
            displayName={displayName}
            errorMessage={errorMessage}
            historyItems={historyItems}
            historyLoading={operation === 'opening'}
            historyErrorMessage={historyErrorMessage}
            isInviteeHandoff={activeCreatorEntrySource !== 'direct'}
            onChangeDisplayName={(value) => {
              setDisplayName(value);
              setErrorMessage(null);
            }}
            onOpenRoom={(roomId) => {
              const historyItem = historyItems.find((item) => item.roomId === roomId);
              if (historyItem != null) {
                void openHistoryRoom(historyItem);
              }
            }}
            onStart={startSurvey}
          />
        </Analytics.Impression>
      ) : null}

      {step === 'compose' ? (
        <Analytics.Impression
          impression="on-mount"
          params={{
            log_name: 'owner_template_view',
            funnel: 'owner_create',
            funnel_step: 2,
            creator_entry_source: activeCreatorEntrySource,
          }}
        >
          <QuestionEditor
            displayName={displayName.trim()}
            questions={questions}
            creatorEntrySource={activeCreatorEntrySource}
            selectedTemplateId={selectedTemplateId}
            onChangeQuestions={(nextQuestions) => {
              setQuestions(nextQuestions);
              setSelectedTemplateId(null);
            }}
            onSelectTemplate={(templateId) => {
              setQuestions(createQuestionDraftsFromTemplate(templateId));
              setSelectedTemplateId(templateId);
            }}
            onReset={() => {
              setQuestions(createDefaultQuestionDrafts());
              setSelectedTemplateId(DEFAULT_TEMPLATE_ID);
            }}
            onBack={() => setStep('intro')}
            onStart={() => {
              setErrorMessage(null);
              setStep('survey');
            }}
          />
        </Analytics.Impression>
      ) : null}

      {step === 'room' && room != null && result != null ? (
        <Analytics.Impression
          impression="on-mount"
          params={{
            log_name: 'owner_room_view',
            funnel: 'owner_create',
            funnel_step: 4,
            creator_entry_source: activeCreatorEntrySource,
            room_entry_source: roomEntrySource ?? 'unknown',
            template_id:
              roomEntrySource === 'created' ? selectedTemplateId ?? 'custom' : 'not_applicable',
          }}
        >
          <OwnerRoomStep
            displayName={displayName.trim()}
            room={room}
            result={result}
            operation={operation}
            errorMessage={errorMessage}
            onBackToHistory={returnToHistory}
            onShare={() => void shareRoom()}
            onRefresh={() => void refreshResult()}
            onDelete={() => void removeRoom()}
          />
        </Analytics.Impression>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  fullScreenImpression: { flex: 1 },
  content: { flexGrow: 1 },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
