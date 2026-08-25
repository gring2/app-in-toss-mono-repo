import { Button, TextField, Txt } from '@toss/tds-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { brandConfig } from '../../../brand.config';
import { formatHistoryDate, type OwnerRoomHistoryItem } from './owner-room-history';

interface OwnerIntroStepProps {
  displayName: string;
  errorMessage: string | null;
  historyItems: readonly OwnerRoomHistoryItem[];
  historyLoading: boolean;
  historyErrorMessage: string | null;
  isInviteeHandoff: boolean;
  onChangeDisplayName: (value: string) => void;
  onOpenRoom: (roomId: string) => void;
  onStart: () => void;
}

export function OwnerIntroStep({
  displayName,
  errorMessage,
  historyItems,
  historyLoading,
  historyErrorMessage,
  isInviteeHandoff,
  onChangeDisplayName,
  onOpenRoom,
  onStart,
}: OwnerIntroStepProps) {
  return (
    <View style={styles.section}>
      <View style={styles.eyebrow}>
        <Txt typography="t7" fontWeight="bold" color="#3182F6">
          {brandConfig.displayName}
        </Txt>
      </View>
      <Txt typography="t1" fontWeight="bold" style={styles.title}>
        {isInviteeHandoff
          ? `이번엔 친구들에게\n나를 물어볼 차례예요`
          : `친구의 눈으로 보면\n나는 어떤 사람일까?`}
      </Txt>
      <Txt typography="t5" color="#4E5968" style={styles.bodyText}>
        {isInviteeHandoff
          ? '방금 친구에게 답했던 것처럼, 재미있는 질문을 골라 내 친구들에게 보내 보세요.'
          : '같은 질문에 내가 보는 나와 친구가 보는 나를 각각 답해요. 친구 3명의 평균이 모이면 두 시선을 비교해 드려요.'}
      </Txt>

      <View style={styles.flowCard} testID="owner-subject-explanation">
        <Txt typography="t6" fontWeight="semiBold">
          {isInviteeHandoff ? '이름과 템플릿만 고르면 돼요' : '첫 번째 답변 대상은 나예요'}
        </Txt>
        <Txt typography="t7" color="#6B7684" style={styles.flowText}>
          {isInviteeHandoff
            ? '먼저 내가 보는 나에 답하고 링크를 보내면, 친구 3명의 평균과 내 답을 비교해 드려요.'
            : '이름을 적고 질문을 다듬은 뒤, 먼저 내가 보는 내 모습에 답해요. 친구들은 같은 질문을 나를 떠올리며 답해요.'}
        </Txt>
      </View>

      <View style={styles.inputSection}>
        <TextField
          variant="box"
          label="설문의 주인공 이름"
          labelOption="sustain"
          placeholder="친구들이 알아볼 이름"
          value={displayName}
          onChangeText={onChangeDisplayName}
          maxLength={20}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onStart}
          hasError={errorMessage != null}
          help={errorMessage ?? '이름은 초대받은 친구에게만 보여요.'}
          testID="display-name-input"
        />
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.privacyCard}>
          <Txt typography="t6" fontWeight="semiBold">
            안심하고 답해도 돼요
          </Txt>
          <Txt typography="t7" color="#6B7684" style={styles.privacyText}>
            개별 친구의 답은 공개하지 않고, 방과 응답은 30일 뒤 자동으로 삭제해요.
          </Txt>
        </View>
        <View style={styles.historySection}>
          <Txt typography="t6" fontWeight="semiBold">
            최근 30일 방 기록
          </Txt>
          <Txt typography="t7" color="#6B7684" style={styles.historyDescription}>
            지난 30일 동안 만든 방을 다시 열어 응답 현황을 확인하거나 새 초대 링크를 공유할 수 있어요.
          </Txt>

          {historyLoading ? (
            <View style={styles.historyStateCard} testID="history-loading">
              <Txt typography="t7" color="#6B7684">
                최근 30일 기록을 불러오고 있어요…
              </Txt>
            </View>
          ) : null}

          {!historyLoading && historyErrorMessage != null ? (
            <View style={styles.errorCard} testID="history-error" accessibilityRole="alert">
              <Txt typography="t7" color="#D22030">
                {historyErrorMessage}
              </Txt>
            </View>
          ) : null}

          {!historyLoading && historyErrorMessage == null && historyItems.length === 0 ? (
            <View style={styles.historyStateCard} testID="history-empty">
              <Txt typography="t7" color="#6B7684">
                최근 30일 동안 만든 방이 아직 없어요.
              </Txt>
            </View>
          ) : null}

          {!historyLoading && historyItems.length > 0 ? (
            <View testID="history-list">
              {historyItems.map((item) => (
                <View key={item.roomId} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyTitleBlock}>
                      <Txt typography="t6" fontWeight="semiBold">
                        {item.displayName}
                      </Txt>
                      <Txt typography="t7" color="#6B7684" style={styles.historyMeta}>
                        생성 {formatHistoryDate(item.createdAt)} · 만료 {formatHistoryDate(item.expiresAt)}
                      </Txt>
                    </View>
                    <View style={[styles.historyBadge, item.revealed ? styles.revealedBadge : styles.waitingBadge]}>
                      <Txt
                        typography="t7"
                        fontWeight="bold"
                        color={item.revealed ? '#0B6BCD' : '#4E5968'}
                      >
                        {item.revealed ? '결과 공개됨' : '답변 기다리는 중'}
                      </Txt>
                    </View>
                  </View>
                  <View style={styles.historyStatusRow}>
                    <Txt typography="t7" color="#4E5968">
                      모인 답변
                    </Txt>
                    <Txt typography="t7" fontWeight="semiBold">
                      {item.responseCount} / {item.requiredCount}명
                    </Txt>
                  </View>
                  <Button
                    display="block"
                    size="large"
                    type="light"
                    style="weak"
                    onPress={() => onOpenRoom(item.roomId)}
                    testID={`open-history-room-${item.roomId}`}
                    viewStyle={styles.secondaryButton}
                  >
                    방 열기
                  </Button>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Button display="block" size="big" onPress={onStart} testID="start-survey-button">
          {isInviteeHandoff
            ? '내 친구렌즈 만들기'
            : historyItems.length > 0
              ? '새 친구렌즈 만들기'
              : '질문 고르고 시작하기'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E8F3FF',
    marginBottom: 20,
  },
  title: { lineHeight: 42 },
  bodyText: { lineHeight: 25, marginTop: 16 },
  inputSection: { marginTop: 40 },
  flowCard: { borderRadius: 16, backgroundColor: '#E8F3FF', padding: 18, marginTop: 28 },
  flowText: { lineHeight: 20, marginTop: 6 },
  bottomArea: { marginTop: 'auto', paddingTop: 32 },
  privacyCard: { borderRadius: 16, backgroundColor: '#F2F4F6', padding: 18, marginBottom: 16 },
  privacyText: { lineHeight: 20, marginTop: 6 },
  historySection: { marginBottom: 16 },
  historyDescription: { lineHeight: 20, marginTop: 6, marginBottom: 12 },
  historyStateCard: { borderRadius: 16, backgroundColor: '#F2F4F6', padding: 18 },
  historyCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    marginTop: 12,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  historyTitleBlock: { flex: 1 },
  historyMeta: { marginTop: 4, lineHeight: 18 },
  historyBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  revealedBadge: { backgroundColor: '#E8F3FF' },
  waitingBadge: { backgroundColor: '#F2F4F6' },
  historyStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  errorCard: { borderRadius: 12, backgroundColor: '#FFF0F1', padding: 14, marginTop: 16 },
  secondaryButton: { marginTop: 8 },
});
