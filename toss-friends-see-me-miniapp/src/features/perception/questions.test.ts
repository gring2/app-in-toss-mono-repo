import {
  createDefaultQuestionDrafts,
  createQuestionDraftsFromTemplate,
  DEFAULT_TEMPLATE_ID,
  QUESTION_TEMPLATES,
} from './questions';

describe('question templates', () => {
  it('keeps every template compatible with the eight-question room contract', () => {
    expect(new Set(QUESTION_TEMPLATES.map((template) => template.id)).size).toBe(
      QUESTION_TEMPLATES.length
    );

    for (const template of QUESTION_TEMPLATES) {
      expect(template.questions).toHaveLength(8);
      expect(
        template.questions.every((prompt) => {
          const length = prompt.trim().length;
          return length >= 1 && length <= 60;
        })
      ).toBe(true);
    }
  });

  it('creates independent editable drafts from a selected template', () => {
    const firstDraft = createQuestionDraftsFromTemplate('hidden-charm');
    const secondDraft = createQuestionDraftsFromTemplate('hidden-charm');

    firstDraft[0] = { prompt: '직접 바꾼 질문' };

    expect(secondDraft[0]?.prompt).toBe(QUESTION_TEMPLATES[1]?.questions[0]);
    expect(createDefaultQuestionDrafts()).toEqual(
      createQuestionDraftsFromTemplate(DEFAULT_TEMPLATE_ID)
    );
  });
});
