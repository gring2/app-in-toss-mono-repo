import { Analytics, FetchAlbumPhotosPermissionError, fetchAlbumPhotos } from '@apps-in-toss/framework';
import { Button, TextField, Txt } from '@toss/tds-react-native';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  QUESTION_TEMPLATES,
  type QuestionDraft,
  type QuestionTemplateId,
} from './questions';

const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_BASE64_LENGTH = 400_000;
const QUESTION_IMAGE_MAX_WIDTH = 360;

interface QuestionEditorProps {
  displayName: string;
  questions: readonly QuestionDraft[];
  creatorEntrySource: string;
  selectedTemplateId: QuestionTemplateId | null;
  onChangeQuestions: (questions: QuestionDraft[]) => void;
  onSelectTemplate: (templateId: QuestionTemplateId) => void;
  onReset: () => void;
  onBack: () => void;
  onStart: () => void;
}

function hasValidQuestions(questions: readonly QuestionDraft[]): boolean {
  return questions.length === 8 && questions.every((question) => {
    const length = question.prompt.trim().length;
    return length >= 1 && length <= 60;
  });
}

export function QuestionEditor({
  displayName,
  questions,
  creatorEntrySource,
  selectedTemplateId,
  onChangeQuestions,
  onSelectTemplate,
  onReset,
  onBack,
  onStart,
}: QuestionEditorProps) {
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageCount = questions.filter((question) => question.imageBase64 != null).length;

  const updateQuestion = (index: number, update: Partial<QuestionDraft>) => {
    onChangeQuestions(
      questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...update } : question
      )
    );
  };

  const addImage = async (index: number) => {
    if (questions[index]?.imageBase64 == null && imageCount >= MAX_IMAGE_COUNT) {
      setImageError(`이미지는 최대 ${MAX_IMAGE_COUNT}장까지 넣을 수 있어요.`);
      return;
    }

    setSelectingIndex(index);
    setImageError(null);

    try {
      const photos = await fetchAlbumPhotos({
        maxCount: 1,
        maxWidth: QUESTION_IMAGE_MAX_WIDTH,
        base64: true,
      });
      const photo = photos[0];
      if (photo == null) {
        return;
      }

      if (photo.dataUri.length > MAX_IMAGE_BASE64_LENGTH) {
        setImageError('사진을 자동으로 줄였지만 아직 용량이 커요. 다른 사진을 골라 주세요.');
        return;
      }

      updateQuestion(index, { imageBase64: photo.dataUri });
    } catch (error) {
      setImageError(
        error instanceof FetchAlbumPhotosPermissionError
          ? '질문에 사진을 넣으려면 사진 접근을 허용해 주세요.'
          : '사진을 불러오지 못했어요. 다시 시도해 주세요.'
      );
    } finally {
      setSelectingIndex(null);
    }
  };

  return (
    <View style={styles.section} testID="question-editor">
      <View style={styles.subjectCard}>
        <Txt typography="t7" fontWeight="bold" color="#3182F6">
          질문의 주인공
        </Txt>
        <Txt typography="t4" fontWeight="bold" style={styles.subjectName}>
          {displayName}님
        </Txt>
        <Txt typography="t7" color="#4E5968" style={styles.subjectHint}>
          친구가 {displayName}님을 떠올리며 답하기 쉬운 문장으로 다듬어 보세요.
        </Txt>
      </View>

      <Txt typography="t2" fontWeight="bold" style={styles.title}>
        어떤 친구렌즈를 보낼까요?
      </Txt>
      <Txt typography="t6" color="#6B7684" style={styles.description}>
        재미있는 템플릿을 고르면 8개 질문이 바로 준비돼요.
      </Txt>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateList}
        testID="question-template-list"
      >
        {QUESTION_TEMPLATES.map((template, index) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <Analytics.Press
              key={template.id}
              params={{
                log_name: 'owner_template_select_click',
                funnel: 'owner_create',
                creator_entry_source: creatorEntrySource,
                template_id: template.id,
                template_position: index + 1,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${template.title} 템플릿${isSelected ? ', 선택됨' : ''}`}
                onPress={() => onSelectTemplate(template.id)}
                style={({ pressed }) => [
                  styles.templateCard,
                  isSelected ? styles.selectedTemplateCard : null,
                  pressed ? styles.pressedTemplateCard : null,
                ]}
                testID={`select-template-${template.id}`}
              >
                <View style={styles.templateHeader}>
                  <Txt typography="t3">{template.emoji}</Txt>
                  {index === 0 ? (
                    <View style={styles.recommendedBadge}>
                      <Txt typography="t7" fontWeight="bold" color="#0B6BCD">
                        추천
                      </Txt>
                    </View>
                  ) : null}
                  {isSelected ? (
                    <View style={styles.selectedBadge}>
                      <Txt typography="t7" fontWeight="bold" color="#FFFFFF">
                        선택됨
                      </Txt>
                    </View>
                  ) : null}
                </View>
                <Txt typography="t5" fontWeight="bold" style={styles.templateTitle}>
                  {template.title}
                </Txt>
                <Txt typography="t7" color="#6B7684" style={styles.templateDescription}>
                  {template.description}
                </Txt>
              </Pressable>
            </Analytics.Press>
          );
        })}
      </ScrollView>

      <Analytics.Press
        params={{
          log_name: 'owner_template_start_click',
          funnel: 'owner_create',
          creator_entry_source: creatorEntrySource,
          template_id: selectedTemplateId ?? 'custom',
        }}
      >
        <Button
          display="block"
          size="big"
          onPress={onStart}
          disabled={!hasValidQuestions(questions)}
          testID="start-template-survey-button"
          viewStyle={styles.quickStartButton}
        >
          이 템플릿으로 바로 답하기
        </Button>
      </Analytics.Press>

      <Txt typography="t4" fontWeight="bold" style={styles.editTitle}>
        내 스타일로 바꾸고 싶다면
      </Txt>
      <Txt typography="t7" color="#6B7684" style={styles.editDescription}>
        질문 문장을 직접 고치거나 사진을 최대 3장까지 넣을 수 있어요.
      </Txt>

      <View style={styles.questionList}>
        {questions.map((question, index) => {
          const isInvalid = question.prompt.trim().length === 0;
          return (
            <View key={index} style={styles.questionCard} testID={`question-card-${index}`}>
              <TextField
                variant="box"
                label={`질문 ${index + 1}`}
                labelOption="sustain"
                value={question.prompt}
                onChangeText={(prompt) => updateQuestion(index, { prompt })}
                maxLength={60}
                hasError={isInvalid}
                help={isInvalid ? '질문을 입력해 주세요.' : `${question.prompt.length} / 60자`}
                multiline
                testID={`question-input-${index}`}
              />

              {question.imageBase64 != null ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${question.imageBase64}` }}
                  style={styles.previewImage}
                  resizeMode="cover"
                  accessibilityLabel={`질문 ${index + 1}에 넣은 사진`}
                  testID={`question-image-${index}`}
                />
              ) : null}

              <Button
                display="block"
                size="large"
                type="light"
                style="weak"
                loading={selectingIndex === index}
                disabled={selectingIndex != null && selectingIndex !== index}
                onPress={() => void addImage(index)}
                testID={`add-question-image-${index}`}
                viewStyle={styles.imageButton}
              >
                {question.imageBase64 == null ? '사진 추가하기' : '사진 바꾸기'}
              </Button>
              {question.imageBase64 != null ? (
                <Button
                  display="block"
                  size="large"
                  type="light"
                  style="weak"
                  onPress={() => updateQuestion(index, { imageBase64: undefined })}
                  testID={`remove-question-image-${index}`}
                >
                  사진 빼기
                </Button>
              ) : null}
            </View>
          );
        })}
      </View>

      {imageError != null ? (
        <View style={styles.errorCard} accessibilityRole="alert">
          <Txt typography="t7" color="#D22030">
            {imageError}
          </Txt>
        </View>
      ) : null}

      <View style={styles.bottomArea}>
        <Analytics.Press
          params={{
            log_name: 'owner_custom_questions_start_click',
            funnel: 'owner_create',
            creator_entry_source: creatorEntrySource,
            template_id: selectedTemplateId ?? 'custom',
          }}
        >
          <Button display="block" size="big" onPress={onStart} disabled={!hasValidQuestions(questions)} testID="start-custom-survey-button">
            수정한 질문으로 내 답변 시작하기
          </Button>
        </Analytics.Press>
        <Button
          display="block"
          size="large"
          type="light"
          style="weak"
          onPress={onReset}
          testID="reset-questions-button"
          viewStyle={styles.secondaryButton}
        >
          추천 템플릿으로 되돌리기
        </Button>
        <Button
          display="block"
          size="large"
          type="light"
          style="weak"
          onPress={onBack}
          testID="back-from-question-editor-button"
          viewStyle={styles.secondaryButton}
        >
          이름 화면으로 돌아가기
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
  subjectCard: { borderRadius: 18, backgroundColor: '#F5F9FF', padding: 18 },
  subjectName: { marginTop: 6 },
  subjectHint: { lineHeight: 20, marginTop: 8 },
  title: { lineHeight: 34, marginTop: 32 },
  description: { lineHeight: 22, marginTop: 10 },
  templateList: { gap: 12, paddingTop: 20, paddingRight: 24 },
  templateCard: {
    width: 248,
    minHeight: 166,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  selectedTemplateCard: { borderWidth: 2, borderColor: '#3182F6', backgroundColor: '#F5F9FF' },
  pressedTemplateCard: { opacity: 0.72 },
  templateHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recommendedBadge: { borderRadius: 999, backgroundColor: '#E8F3FF', paddingHorizontal: 9, paddingVertical: 5 },
  selectedBadge: { borderRadius: 999, backgroundColor: '#3182F6', paddingHorizontal: 9, paddingVertical: 5 },
  templateTitle: { marginTop: 14 },
  templateDescription: { lineHeight: 20, marginTop: 8 },
  quickStartButton: { marginTop: 20 },
  editTitle: { marginTop: 40 },
  editDescription: { lineHeight: 20, marginTop: 8 },
  questionList: { gap: 16, marginTop: 20 },
  questionCard: { borderRadius: 18, borderWidth: 1, borderColor: '#E5E8EB', padding: 16 },
  previewImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, backgroundColor: '#F2F4F6', marginTop: 14 },
  imageButton: { marginTop: 10 },
  errorCard: { borderRadius: 12, backgroundColor: '#FFF0F1', padding: 14, marginTop: 16 },
  bottomArea: { paddingTop: 28 },
  secondaryButton: { marginTop: 8 },
});
