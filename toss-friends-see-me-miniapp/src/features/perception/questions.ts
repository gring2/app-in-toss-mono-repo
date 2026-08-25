export interface SurveyQuestion {
  prompt: string;
  imageUri?: string;
}

export interface QuestionDraft {
  prompt: string;
  imageBase64?: string;
}

export interface QuestionTemplate {
  id: 'friend-chaos' | 'hidden-charm' | 'group-role' | 'warm-friend';
  emoji: string;
  title: string;
  description: string;
  questions: readonly string[];
}

export type QuestionTemplateId = QuestionTemplate['id'];

export const QUESTION_TEMPLATES = [
  {
    id: 'friend-chaos',
    emoji: '🎢',
    title: '우당탕 찐친 모먼트',
    description: '단톡방·여행·노래방에서 보이는 내 캐릭터',
    questions: [
      '단톡방이 조용해지면 먼저 웃긴 이야기를 꺼낼 것 같다',
      '갑자기 만나자고 해도 생각보다 잘 나올 것 같다',
      '여행을 가면 맛집이나 놀거리를 누구보다 빨리 찾을 것 같다',
      '계획이 꼬여도 그 상황을 재미있는 추억으로 만들 것 같다',
      '친구 사진을 가장 잘 건져 줄 것 같다',
      '내 흑역사를 알지만 놀릴 타이밍은 지켜 줄 것 같다',
      '노래방에서 분위기가 처지면 먼저 마이크를 잡을 것 같다',
      '하루 종일 같이 놀아도 헤어질 때 아쉬운 친구일 것 같다',
    ],
  },
  {
    id: 'hidden-charm',
    emoji: '🎭',
    title: '친구만 아는 반전 매력',
    description: '첫인상 뒤에 숨은 의외의 내 모습',
    questions: [
      '처음엔 조용해 보여도 친해지면 제일 웃긴 사람일 것 같다',
      '무심한 척해도 친구 생일이나 약속을 잘 기억할 것 같다',
      '평소와 달리 위기에서는 누구보다 침착할 것 같다',
      '칭찬을 들으면 아무렇지 않은 척하면서 속으로 좋아할 것 같다',
      '낯선 자리보다 친한 친구들 사이에서 매력이 더 잘 보일 것 같다',
      '친구가 힘들 때 말보다 행동으로 먼저 챙길 것 같다',
      '혼자만의 확실한 취향과 세계가 있을 것 같다',
      '알면 알수록 새로운 면이 계속 나오는 사람일 것 같다',
    ],
  },
  {
    id: 'group-role',
    emoji: '🧩',
    title: '우리 모임 속 내 캐릭터',
    description: '약속을 잡을 때 드러나는 내 역할',
    questions: [
      '모임 날짜를 잡을 때 가장 먼저 가능한 날을 알려 줄 것 같다',
      '메뉴를 못 고를 때 모두가 납득할 선택을 해 줄 것 같다',
      '어색한 새 친구가 오면 자연스럽게 대화에 끼워 줄 것 같다',
      '길을 잃거나 예약이 꼬이면 해결 방법을 먼저 찾을 것 같다',
      '모임에서 나온 웃긴 말을 가장 오래 기억할 것 같다',
      '다툼이 생기면 누구 편보다 분위기를 풀 방법을 찾을 것 같다',
      '집에 잘 도착했는지 마지막까지 확인할 것 같다',
      '없으면 모임 분위기가 확실히 달라지는 사람일 것 같다',
    ],
  },
  {
    id: 'warm-friend',
    emoji: '🔍',
    title: '따뜻한 친구 렌즈',
    description: '평소에 보여 준 배려와 믿음',
    questions: [
      '처음 만난 사람들뿐인 자리에서도 먼저 말을 걸어 어색함을 풀 것 같다',
      '약속 시간 10분 전, 이미 도착해서 기다리고 있을 것 같다',
      '내가 말하지 않아도 힘든 걸 눈치채고 먼저 안부를 물을 것 같다',
      '모두 말이 끊긴 순간, 자연스럽게 새 이야기를 꺼낼 것 같다',
      '같이 하기로 한 일은 마지막까지 놓치지 않고 챙길 것 같다',
      '고민을 털어놓으면 해결책보다 내 마음을 먼저 알아줄 것 같다',
      '계획이 완전히 틀어져도 금방 다음 재미를 찾아낼 것 같다',
      '아무 말 없이 같이 있어도 편안한 사람일 것 같다',
    ],
  },
] as const satisfies readonly QuestionTemplate[];

export const DEFAULT_TEMPLATE_ID: QuestionTemplateId = 'friend-chaos';

export const PERCEPTION_QUESTIONS = QUESTION_TEMPLATES[0].questions;

export const SCORE_LABELS = ['전혀 아님', '조금 아님', '반반', '꽤 맞음', '완전 맞음'] as const;

export const SCORE_EMOJIS = ['😶', '😕', '🤔', '😊', '🤩'] as const;

export const FRIEND_MOMENT_EMOJIS = ['👋', '⏰', '👀', '💬', '✅', '🫶', '⚡', '☁️'] as const;

export function createQuestionDraftsFromTemplate(templateId: QuestionTemplateId): QuestionDraft[] {
  const template = QUESTION_TEMPLATES.find((candidate) => candidate.id === templateId);
  if (template == null) {
    throw new Error(`Unknown question template: ${templateId}`);
  }

  return template.questions.map((prompt) => ({ prompt }));
}

export function createDefaultQuestionDrafts(): QuestionDraft[] {
  return createQuestionDraftsFromTemplate(DEFAULT_TEMPLATE_ID);
}

export function createDefaultSurveyQuestions(): SurveyQuestion[] {
  return PERCEPTION_QUESTIONS.map((prompt) => ({ prompt }));
}
