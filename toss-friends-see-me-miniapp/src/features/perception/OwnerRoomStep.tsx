import { Button, ProgressBar, Txt } from '@toss/tds-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { PerceptionResult } from '../../lib/supabase/perception-api';
import { formatHistoryDate, type ActiveRoom } from './owner-room-history';
import { describeInsightDifference, getPerceptionInsights } from './result-insights';

export type OwnerRoomOperation = 'creating' | 'refreshing' | 'sharing' | 'rotating' | 'opening' | 'deleting' | null;

interface OwnerRoomStepProps {
  displayName: string;
  room: ActiveRoom;
  result: PerceptionResult;
  operation: OwnerRoomOperation;
  errorMessage: string | null;
  onBackToHistory: () => void;
  onShare: () => void;
  onRefresh: () => void;
  onDelete: () => void;
}

export function OwnerRoomStep({
  displayName,
  room,
  result,
  operation,
  errorMessage,
  onBackToHistory,
  onShare,
  onRefresh,
  onDelete,
}: OwnerRoomStepProps) {
  const expiresAt = formatHistoryDate(room.expiresAt);
  const busy = operation != null;

  return (
    <View style={styles.section}>
      <View style={styles.successIcon}>
        <Txt typography="t2">✓</Txt>
      </View>
      <Txt typography="t2" fontWeight="bold" textAlign="center" style={styles.roomTitle}>
        친구렌즈가 준비됐어요
      </Txt>
      <Txt typography="t5" color="#4E5968" textAlign="center" style={styles.bodyText}>
        {displayName}님을 친구들이 어떻게 보는지 확인하려면 3명의 답변이 필요해요.
      </Txt>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Txt typography="t6" color="#6B7684">
            모인 답변
          </Txt>
          <Txt typography="t4" fontWeight="bold" color="#3182F6" testID="response-count">
            {result.responseCount} / {result.requiredCount}명
          </Txt>
        </View>
        <ProgressBar
          progress={Math.min((result.responseCount / result.requiredCount) * 100, 100)}
          size="normal"
          color="#3182F6"
        />
        <Txt typography="t7" color="#8B95A1" style={styles.statusHint}>
          {result.revealed ? '친구들의 평균과 내 답을 비교해 보세요.' : '3명이 모일 때까지 결과는 비공개예요.'}
        </Txt>
      </View>

      <View style={styles.inviteCard}>
        <Txt typography="t6" fontWeight="semiBold">
          친구는 익명으로 답해요
        </Txt>
        <Txt typography="t7" color="#6B7684" style={styles.inviteHint}>
          {room.inviteToken == null
            ? `이 기기에는 초대 토큰이 없어도 공유를 누르면 새 링크를 다시 만들 수 있어요. 초대는 ${expiresAt}까지 열려 있어요.`
            : `누가 어떤 답을 골랐는지는 저장해도 화면에 보여주지 않아요. 초대는 ${expiresAt}까지 열려 있어요.`}
        </Txt>
      </View>

      {result.revealed ? <ResultComparison result={result} /> : null}

      {errorMessage != null ? (
        <View style={styles.errorCard} accessibilityRole="alert">
          <Txt typography="t7" color="#D22030">
            {errorMessage}
          </Txt>
        </View>
      ) : null}

      <View style={styles.bottomArea}>
        <Button
          display="block"
          size="large"
          type="light"
          style="weak"
          onPress={onBackToHistory}
          disabled={busy}
          testID="back-to-history-button"
        >
          최근 30일 기록으로 돌아가기
        </Button>
        <Button
          display="block"
          size="big"
          onPress={onShare}
          loading={operation === 'sharing' || operation === 'rotating'}
          disabled={busy && operation !== 'sharing' && operation !== 'rotating'}
          testID="share-invite-button"
        >
          친구에게 공유하기
        </Button>
        <Button
          display="block"
          size="large"
          type="light"
          style="weak"
          onPress={onRefresh}
          loading={operation === 'refreshing'}
          disabled={busy && operation !== 'refreshing'}
          testID="refresh-result-button"
          viewStyle={styles.secondaryButton}
        >
          응답 현황 새로고침
        </Button>
        <Button
          display="block"
          size="large"
          type="light"
          style="weak"
          onPress={onDelete}
          loading={operation === 'deleting'}
          disabled={busy && operation !== 'deleting'}
          testID="delete-room-button"
          viewStyle={styles.secondaryButton}
        >
          방과 응답 모두 삭제하기
        </Button>
      </View>
    </View>
  );
}

function ResultComparison({ result }: { result: Extract<PerceptionResult, { revealed: true }> }) {
  const insights = getPerceptionInsights(result.questions, result.selfAnswers, result.friendAverages);

  return (
    <View style={styles.comparisonSection} testID="revealed-result">
      <Txt typography="t4" fontWeight="bold" style={styles.insightSectionTitle}>
        한눈에 보기
      </Txt>
      <View style={[styles.insightCard, styles.alignedInsightCard]} testID="most-aligned-insight">
        <Txt typography="t7" fontWeight="bold" color="#3182F6">
          친구와 비슷하게 본 모습
        </Txt>
        <Txt typography="t5" fontWeight="bold" style={styles.insightQuestion}>
          {insights.mostAligned.question}
        </Txt>
        <Txt typography="t7" color="#4E5968" style={styles.insightDescription}>
          {describeInsightDifference(insights.mostAligned)}
        </Txt>
      </View>
      <View style={[styles.insightCard, styles.differentInsightCard]} testID="most-different-insight">
        <Txt typography="t7" fontWeight="bold" color="#F04452">
          시선이 가장 달랐던 모습
        </Txt>
        <Txt typography="t5" fontWeight="bold" style={styles.insightQuestion}>
          {insights.mostDifferent.question}
        </Txt>
        <Txt typography="t7" color="#4E5968" style={styles.insightDescription}>
          {describeInsightDifference(insights.mostDifferent)}
        </Txt>
      </View>
      <Txt typography="t4" fontWeight="bold" style={styles.comparisonTitle}>
        질문별 비교
      </Txt>
      {result.questions.map((question, index) => (
        <View key={`${index}-${question.prompt}`} style={styles.comparisonRow}>
          <Txt typography="t7" color="#4E5968" style={styles.comparisonQuestion}>
            {question.prompt}
          </Txt>
          <Txt typography="t7" fontWeight="semiBold">
            나 {result.selfAnswers[index]?.toFixed(1)} · 친구 {result.friendAverages[index]?.toFixed(1)}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3FF',
    alignSelf: 'center',
    marginTop: 8,
  },
  roomTitle: { marginTop: 24 },
  bodyText: { lineHeight: 25, marginTop: 16 },
  statusCard: { borderRadius: 18, backgroundColor: '#F5F9FF', padding: 20, marginTop: 36 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusHint: { marginTop: 12 },
  inviteCard: { borderRadius: 16, backgroundColor: '#F2F4F6', padding: 18, marginTop: 16 },
  inviteHint: { lineHeight: 20, marginTop: 6 },
  errorCard: { borderRadius: 12, backgroundColor: '#FFF0F1', padding: 14, marginTop: 16 },
  bottomArea: { marginTop: 'auto', paddingTop: 32 },
  secondaryButton: { marginTop: 8 },
  comparisonSection: { marginTop: 32 },
  insightSectionTitle: { marginBottom: 12 },
  insightCard: { borderRadius: 18, padding: 18, marginBottom: 12 },
  alignedInsightCard: { backgroundColor: '#F5F9FF' },
  differentInsightCard: { backgroundColor: '#FFF5F5' },
  insightQuestion: { lineHeight: 24, marginTop: 10 },
  insightDescription: { lineHeight: 20, marginTop: 8 },
  comparisonTitle: { marginTop: 20, marginBottom: 8 },
  comparisonRow: { borderBottomWidth: 1, borderBottomColor: '#F2F4F6', paddingVertical: 14 },
  comparisonQuestion: { marginBottom: 6 },
});
