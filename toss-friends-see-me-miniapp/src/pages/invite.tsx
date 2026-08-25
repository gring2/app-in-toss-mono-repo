import { Analytics } from '@apps-in-toss/framework';
import { createRoute } from '@granite-js/react-native';
import { Button, Txt } from '@toss/tds-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PerceptionSurvey } from '../features/perception/PerceptionSurvey';
import { getNetworkAwareErrorMessage } from '../features/perception/error-messages';
import {
  getInvite,
  submitFriendResponse,
  type AnswerScore,
  type InviteSummary,
  type SubmissionReceipt,
} from '../lib/supabase/perception-api';
import type { CreatorEntrySource } from './index';

interface InviteParams {
  token: string;
}

export const Route = createRoute('/invite', {
  validateParams: (params): InviteParams => {
    const token = (params as { token?: unknown } | undefined)?.token;
    return { token: typeof token === 'string' ? token : '' };
  },
  component: InvitePage,
});

type InviteStep = 'intro' | 'survey' | 'submitted';
type InviteCreatorEntrySource = Exclude<CreatorEntrySource, 'direct'>;

function InvitePage() {
  const { token } = Route.useParams();
  const navigation = Route.useNavigation();

  return (
    <InviteContent
      token={token}
      onGoHome={() => navigation.navigate('/')}
      onStartCreator={(source) => navigation.navigate('/', { source })}
    />
  );
}

export function InviteContent({
  token,
  onGoHome,
  onStartCreator,
}: {
  token: string;
  onGoHome: () => void;
  onStartCreator?: (source: InviteCreatorEntrySource) => void;
}) {
  const [invite, setInvite] = useState<InviteSummary | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [step, setStep] = useState<InviteStep>('intro');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const activeTokenRef = useRef(token);
  activeTokenRef.current = token;

  const startCreator = (source: InviteCreatorEntrySource) => {
    if (onStartCreator == null) {
      onGoHome();
      return;
    }

    onStartCreator(source);
  };

  const loadInvite = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const isLatestRequest = () => requestIdRef.current === requestId;

    if (token.length === 0) {
      if (isLatestRequest()) {
        setInvite(null);
        setErrorMessage('초대 링크가 올바르지 않아요.');
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextInvite = await getInvite(token);
      if (isLatestRequest()) {
        setInvite(nextInvite);
        if (nextInvite == null) {
          setErrorMessage('초대가 만료됐거나 삭제됐어요.');
        }
      }
    } catch (error) {
      if (isLatestRequest()) {
        setErrorMessage(getNetworkAwareErrorMessage(error, '초대를 불러오지 못했어요. 다시 시도해 주세요.'));
      }
    } finally {
      if (isLatestRequest()) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    setInvite(null);
    setReceipt(null);
    setStep('intro');
    setErrorMessage(null);
    setLoading(true);
    void loadInvite();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadInvite]);

  const submitAnswers = async (answers: readonly AnswerScore[]) => {
    const submissionToken = token;
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextReceipt = await submitFriendResponse(token, answers);
      if (activeTokenRef.current === submissionToken) {
        setReceipt(nextReceipt);
        setStep('submitted');
      }
    } catch (error) {
      if (activeTokenRef.current === submissionToken) {
        setErrorMessage(
          getNetworkAwareErrorMessage(error, '답변을 보내지 못했어요. 초대가 만료되지 않았는지 확인해 주세요.')
        );
      }
    } finally {
      if (activeTokenRef.current === submissionToken) {
        setLoading(false);
      }
    }
  };

  if (loading && invite == null) {
    return (
      <View style={styles.centeredState} testID="invite-loading">
        <Txt typography="t5" color="#6B7684">
          초대를 확인하고 있어요…
        </Txt>
      </View>
    );
  }

  if (invite == null) {
    return (
      <StateCard
        title="초대를 열 수 없어요"
        description={errorMessage ?? '초대가 만료됐거나 삭제됐어요.'}
        primaryLabel="다시 시도하기"
        onPrimary={() => void loadInvite()}
        secondaryLabel="나도 친구렌즈 만들기"
        onSecondary={onGoHome}
        testID="invite-error"
      />
    );
  }

  if (invite.isOwner) {
    return (
      <StateCard
        title="내가 만든 친구렌즈예요"
        description="이 링크에서는 친구 답변을 받을 수 있어요. 내 화면에서 응답 현황을 확인해 주세요."
        primaryLabel="내 화면으로 가기"
        onPrimary={onGoHome}
        testID="invite-owner"
      />
    );
  }

  if (invite.alreadyAnswered && step !== 'submitted') {
    return (
      <Analytics.Impression
        impression="on-mount"
        style={styles.fullScreenImpression}
        params={{
          log_name: 'invite_already_answered_view',
          funnel: 'invite_to_creator',
          creator_entry_source: 'invite_already_answered',
        }}
      >
        <StateCard
          title="이미 답변을 보냈어요"
          description="한 친구의 최신 답변 하나만 반영돼요. 이번에는 내 질문을 만들어 친구들에게 보내볼 수 있어요."
          primaryLabel="내 친구렌즈 만들기"
          onPrimary={() => startCreator('invite_already_answered')}
          primaryAnalyticsName="invite_creator_cta_click"
          primaryAnalyticsSource="invite_already_answered"
          testID="invite-already-answered"
        />
      </Analytics.Impression>
    );
  }

  if (step === 'survey') {
    return (
      <Analytics.Impression
        impression="on-mount"
        style={styles.fullScreenImpression}
        params={{ log_name: 'invite_survey_view', funnel: 'invite_response', funnel_step: 2 }}
      >
        <View style={styles.screen} testID="friend-survey">
          <PerceptionSurvey
            questions={invite.questions}
            subjectName={invite.displayName}
            perspective="friend"
            submitLabel="익명으로 답변 보내기"
            loading={loading}
            errorMessage={errorMessage}
            onComplete={(answers) => void submitAnswers(answers)}
            onExit={() => setStep('intro')}
            exitLabel="안내로 돌아가기"
          />
        </View>
      </Analytics.Impression>
    );
  }

  if (step === 'submitted' && receipt != null) {
    return (
      <Analytics.Impression
        impression="on-mount"
        style={styles.fullScreenImpression}
        params={{
          log_name: 'invite_submitted_view',
          funnel: 'invite_response',
          funnel_step: 3,
        }}
      >
        <InviteSubmittedStep
          responseCount={receipt.responseCount}
          onStartCreator={() => startCreator('invite_submitted')}
        />
      </Analytics.Impression>
    );
  }

  return (
    <Analytics.Impression
      impression="on-mount"
      style={styles.fullScreenImpression}
      params={{ log_name: 'invite_intro_view', funnel: 'invite_response', funnel_step: 1 }}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="invite-intro">
        <View style={styles.section}>
          <View style={styles.lensIcon}>
            <Txt typography="t2">◎</Txt>
          </View>
          <Txt typography="t2" fontWeight="bold" textAlign="center" style={styles.title}>
            {invite.displayName}님을 떠올리며{`\n`}답해 주세요
          </Txt>
          <Txt typography="t5" color="#4E5968" textAlign="center" style={styles.description}>
            이건 나의 MBTI나 성격을 알아보는 검사가 아니에요. {invite.displayName}님을 내가 어떻게 보는지 묻는 설문이에요.
          </Txt>
          <View style={styles.subjectExample} testID="invite-subject-explanation">
            <Txt typography="t7" fontWeight="bold" color="#3182F6">
              이렇게 생각해 주세요
            </Txt>
            <Txt typography="t7" color="#4E5968" style={styles.subjectExampleText}>
              “나는 계획적인가?”가 아니라 “{invite.displayName}님은 계획적인가?”를 떠올리면 돼요.
            </Txt>
          </View>
          <View style={styles.privacyCard}>
            <Txt typography="t6" fontWeight="semiBold">
              답변은 익명이에요
            </Txt>
            <Txt typography="t7" color="#6B7684" style={styles.privacyText}>
              개별 답변은 공개하지 않고 방과 함께 30일 뒤 자동 삭제해요.
            </Txt>
          </View>
          <View style={styles.bottomArea}>
            <Analytics.Press
              params={{
                log_name: 'invite_response_start_click',
                funnel: 'invite_response',
              }}
            >
              <Button display="block" size="big" onPress={() => setStep('survey')} testID="start-friend-survey-button">
                {invite.displayName}님에 대해 답하기
              </Button>
            </Analytics.Press>
          </View>
        </View>
      </ScrollView>
    </Analytics.Impression>
  );
}

function InviteSubmittedStep({
  responseCount,
  onStartCreator,
}: {
  responseCount: number;
  onStartCreator: () => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID="invite-submitted">
      <View style={styles.stateSection}>
        <View style={styles.successIcon}>
          <Txt typography="t2">✓</Txt>
        </View>
        <Txt typography="t2" fontWeight="bold" textAlign="center" style={styles.title}>
          익명 답변을 보냈어요
        </Txt>
        <Txt typography="t5" color="#4E5968" textAlign="center" style={styles.description}>
          {responseCount}명의 답변이 모였어요. 누가 어떤 답을 했는지는 공개되지 않아요.
        </Txt>

        <View style={styles.creatorCard}>
          <Txt typography="t7" fontWeight="bold" color="#3182F6">
            이번엔 친구들이 보는 나
          </Txt>
          <Txt typography="t4" fontWeight="bold" style={styles.creatorTitle}>
            나도 친구들에게 물어볼까요?
          </Txt>
          <Txt typography="t7" color="#4E5968" style={styles.creatorDescription}>
            방금 답한 방식 그대로, 이름과 재미있는 템플릿만 고르면 내 질문이 완성돼요.
          </Txt>
          <Txt typography="t7" color="#6B7684" style={styles.creatorHint}>
            친구 3명이 답하면 내가 보는 나와 친구들이 보는 나를 비교해 드려요.
          </Txt>
        </View>

        <View style={styles.bottomArea}>
          <Analytics.Press
            params={{
              log_name: 'invite_creator_cta_click',
              funnel: 'invite_to_creator',
              creator_entry_source: 'invite_submitted',
            }}
          >
            <Button display="block" size="big" onPress={onStartCreator} testID="invite-creator-cta">
              내 친구렌즈 만들기
            </Button>
          </Analytics.Press>
        </View>
      </View>
    </ScrollView>
  );
}

interface StateCardProps {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  primaryAnalyticsName?: string;
  primaryAnalyticsSource?: InviteCreatorEntrySource;
  testID: string;
}

function StateCard({
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryAnalyticsName,
  primaryAnalyticsSource,
  testID,
}: StateCardProps) {
  const primaryButton = (
    <Button display="block" size="big" onPress={onPrimary} testID={`${testID}-primary`}>
      {primaryLabel}
    </Button>
  );

  return (
    <View style={styles.stateSection} testID={testID}>
      <View style={styles.lensIcon}>
        <Txt typography="t2">◎</Txt>
      </View>
      <Txt typography="t2" fontWeight="bold" textAlign="center" style={styles.title}>
        {title}
      </Txt>
      <Txt typography="t5" color="#4E5968" textAlign="center" style={styles.description}>
        {description}
      </Txt>
      <View style={styles.bottomArea}>
        {primaryAnalyticsName == null ? (
          primaryButton
        ) : (
          <Analytics.Press
            params={{
              log_name: primaryAnalyticsName,
              funnel: 'invite_to_creator',
              creator_entry_source: primaryAnalyticsSource ?? 'unknown',
            }}
          >
            {primaryButton}
          </Analytics.Press>
        )}
        {secondaryLabel != null && onSecondary != null ? (
          <Button
            display="block"
            size="large"
            type="light"
            style="weak"
            onPress={onSecondary}
            viewStyle={styles.secondaryButton}
          >
            {secondaryLabel}
          </Button>
        ) : null}
      </View>
    </View>
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
  section: { flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 },
  stateSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  lensIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#E8F3FF',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#DFF7E8',
  },
  title: { lineHeight: 34, marginTop: 28 },
  description: { lineHeight: 25, marginTop: 16 },
  privacyCard: { borderRadius: 16, backgroundColor: '#F2F4F6', padding: 18, marginTop: 36 },
  subjectExample: { borderRadius: 16, backgroundColor: '#E8F3FF', padding: 18, marginTop: 28 },
  subjectExampleText: { lineHeight: 20, marginTop: 6 },
  privacyText: { lineHeight: 20, marginTop: 6 },
  creatorCard: { borderRadius: 20, backgroundColor: '#F5F9FF', padding: 20, marginTop: 32 },
  creatorTitle: { lineHeight: 28, marginTop: 10 },
  creatorDescription: { lineHeight: 21, marginTop: 10 },
  creatorHint: { lineHeight: 20, marginTop: 14 },
  bottomArea: { marginTop: 'auto', paddingTop: 32 },
  secondaryButton: { marginTop: 8 },
});
