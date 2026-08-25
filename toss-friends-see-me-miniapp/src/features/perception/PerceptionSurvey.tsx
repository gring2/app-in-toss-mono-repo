import { Button, ProgressBar, Txt } from '@toss/tds-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { AnswerScore } from '../../lib/supabase/perception-api';
import { FRIEND_MOMENT_EMOJIS, SCORE_EMOJIS, SCORE_LABELS, type SurveyQuestion } from './questions';

interface PerceptionSurveyProps {
  questions: readonly SurveyQuestion[];
  subjectName: string;
  perspective: 'self' | 'friend';
  submitLabel: string;
  loading: boolean;
  errorMessage: string | null;
  onComplete: (answers: readonly AnswerScore[]) => void;
  onExit?: () => void;
  exitLabel?: string;
}

function isCompleteAnswerSet(
  answers: readonly (AnswerScore | null)[],
  questionCount: number
): answers is readonly AnswerScore[] {
  return answers.length === questionCount && answers.every((answer) => answer != null);
}

export function PerceptionSurvey({
  questions,
  subjectName,
  perspective,
  submitLabel,
  loading,
  errorMessage,
  onComplete,
  onExit,
  exitLabel = '질문 편집으로 돌아가기',
}: PerceptionSurveyProps) {
  const [answers, setAnswers] = useState<(AnswerScore | null)[]>(
    Array.from({ length: questions.length }, () => null)
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const currentQuestion = questions[questionIndex] ?? questions[0];
  const selectedScore = answers[questionIndex] ?? null;
  const isLastQuestion = questionIndex === questions.length - 1;
  const subjectTitle = perspective === 'self' ? `내가 생각하는 ${subjectName}님` : `답변 대상 · ${subjectName}님`;
  const subjectHint = perspective === 'self'
    ? '지금은 다른 사람이 아닌, 내가 보는 내 모습에 답해요.'
    : `나 자신이 아니라 ${subjectName}님을 떠올리며 답해요.`;
  const momentEmoji = FRIEND_MOMENT_EMOJIS[questionIndex] ?? '🔍';

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [questionIndex]);

  useEffect(() => {
    if (errorMessage != null) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [errorMessage]);

  const selectScore = (score: AnswerScore) => {
    setAnswers((previous) => previous.map((answer, index) => (index === questionIndex ? score : answer)));
  };

  const moveNext = () => {
    if (selectedScore == null) {
      return;
    }

    if (!isLastQuestion) {
      setQuestionIndex((previous) => previous + 1);
      return;
    }

    if (isCompleteAnswerSet(answers, questions.length)) {
      onComplete(answers);
    }
  };

  const moveBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((previous) => previous - 1);
      return;
    }

    onExit?.();
  };

  if (questions.length === 0) {
    return (
      <View style={styles.emptyState} testID="survey-empty">
        <Txt typography="t3" fontWeight="bold" textAlign="center">
          질문을 불러오지 못했어요
        </Txt>
        <Txt typography="t6" color="#6B7684" textAlign="center" style={styles.emptyDescription}>
          질문 화면으로 돌아가 다시 준비해 주세요.
        </Txt>
        {onExit != null ? (
          <Button display="block" size="big" onPress={onExit} viewStyle={styles.emptyButton}>
            돌아가기
          </Button>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.section}
        showsVerticalScrollIndicator
        testID="survey-scroll"
      >
        <View style={styles.subjectCard} testID="survey-subject-card">
          <Txt typography="t6" fontWeight="bold" color="#0B6BCD">
            {subjectTitle}
          </Txt>
          <Txt typography="t7" color="#4E5968" style={styles.subjectHint}>
            {subjectHint}
          </Txt>
        </View>

        <View style={styles.progressHeader}>
          <Txt typography="t6" fontWeight="semiBold" color="#3182F6">
            {questionIndex + 1} / {questions.length}
          </Txt>
          <ProgressBar
            progress={((questionIndex + 1) / questions.length) * 100}
            size="normal"
            color="#3182F6"
            style={styles.progressBar}
          />
        </View>

        <View style={styles.questionCard}>
          <View style={styles.momentChip}>
            <Txt typography="t7" fontWeight="bold" color="#6B7684">
              {momentEmoji} 친구 모먼트 {questionIndex + 1}
            </Txt>
          </View>

          {currentQuestion?.imageUri != null ? (
            <Image
              source={{ uri: currentQuestion.imageUri }}
              style={styles.questionImage}
              resizeMode="cover"
              accessibilityLabel={`${subjectName}님에 관한 질문 이미지`}
              testID="survey-question-image"
            />
          ) : null}

          <Txt typography="t2" fontWeight="bold" style={styles.question}>
            {currentQuestion?.prompt}
          </Txt>
          <Txt typography="t6" color="#6B7684" style={styles.questionHint}>
            이 장면이 얼마나 잘 어울리는지 골라 주세요.
          </Txt>
        </View>

        <View accessibilityRole="radiogroup" style={styles.scoreRail}>
          {SCORE_LABELS.map((label, index) => {
            const score = (index + 1) as AnswerScore;
            const selected = score === selectedScore;

            return (
              <Pressable
                key={score}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${score}점, ${label}`}
                onPress={() => selectScore(score)}
                style={styles.scoreReaction}
                testID={`score-${score}`}
              >
                <View style={[styles.reactionBubble, selected ? styles.selectedReactionBubble : null]}>
                  <Txt typography="t4">{SCORE_EMOJIS[index]}</Txt>
                </View>
                <Txt
                  typography="t7"
                  fontWeight={selected ? 'bold' : 'regular'}
                  color={selected ? '#0B6BCD' : '#6B7684'}
                  textAlign="center"
                  style={styles.reactionLabel}
                >
                  {label}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.selectionCard, selectedScore != null ? styles.selectedSelectionCard : null]}>
          <Txt
            typography="t6"
            fontWeight={selectedScore == null ? 'regular' : 'bold'}
            color={selectedScore == null ? '#8B95A1' : '#0B6BCD'}
          >
            {selectedScore == null
              ? '가장 가까운 반응을 톡 골라 주세요'
              : `${SCORE_EMOJIS[selectedScore - 1]} ${SCORE_LABELS[selectedScore - 1]} · 선택됨`}
          </Txt>
        </View>

        {errorMessage != null ? (
          <Txt typography="t7" color="#F04452" style={styles.errorText} accessibilityRole="alert">
            {errorMessage}
          </Txt>
        ) : null}
      </ScrollView>

      <View style={styles.bottomArea} testID="survey-bottom-actions">
        <Button
          display="block"
          size="big"
          onPress={moveNext}
          disabled={selectedScore == null}
          loading={loading}
          testID="next-question-button"
        >
          {selectedScore == null ? '반응을 골라 주세요' : isLastQuestion ? submitLabel : '다음 모먼트'}
        </Button>
        {questionIndex > 0 || onExit != null ? (
          <Button
            display="block"
            size="large"
            type="light"
            style="weak"
            onPress={moveBack}
            disabled={loading}
            testID="previous-question-button"
            viewStyle={styles.backButton}
          >
            {questionIndex === 0 ? exitLabel : '이전 질문'}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#FFFFFF' },
  emptyDescription: { lineHeight: 22, marginTop: 10 },
  emptyButton: { marginTop: 28 },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  section: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  subjectCard: {
    borderRadius: 18,
    backgroundColor: '#E8F3FF',
    padding: 18,
    marginBottom: 28,
  },
  subjectHint: { lineHeight: 20, marginTop: 6 },
  progressHeader: {
    marginBottom: 32,
  },
  progressBar: {
    marginTop: 12,
  },
  questionCard: {
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  momentChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 18,
  },
  question: {
    lineHeight: 36,
  },
  questionImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    backgroundColor: '#F2F4F6',
    marginBottom: 20,
  },
  questionHint: {
    marginTop: 12,
  },
  scoreRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 28,
  },
  scoreReaction: {
    flex: 1,
    alignItems: 'center',
  },
  reactionBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedReactionBubble: {
    backgroundColor: '#E8F3FF',
    borderColor: '#3182F6',
  },
  reactionLabel: { lineHeight: 17, marginTop: 8 },
  selectionCard: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginTop: 18,
    paddingHorizontal: 12,
  },
  selectedSelectionCard: { backgroundColor: '#F5F9FF' },
  errorText: {
    marginTop: 14,
  },
  bottomArea: {
    borderTopWidth: 1,
    borderTopColor: '#F2F4F6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: { marginTop: 8 },
});
