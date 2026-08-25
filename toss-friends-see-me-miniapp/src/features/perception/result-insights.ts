import type { SurveyQuestion } from './questions';

export interface PerceptionInsight {
  question: string;
  selfScore: number;
  friendScore: number;
  difference: number;
}

export interface PerceptionInsights {
  mostAligned: PerceptionInsight;
  mostDifferent: PerceptionInsight;
}

function insightAt(
  questions: readonly SurveyQuestion[],
  selfAnswers: readonly number[],
  friendAverages: readonly number[],
  index: number
): PerceptionInsight {
  const selfScore = selfAnswers[index] ?? 0;
  const friendScore = friendAverages[index] ?? 0;

  return {
    question: questions[index]?.prompt ?? '',
    selfScore,
    friendScore,
    difference: Math.abs(selfScore - friendScore),
  };
}

export function getPerceptionInsights(
  questions: readonly SurveyQuestion[],
  selfAnswers: readonly number[],
  friendAverages: readonly number[]
): PerceptionInsights {
  const insights = questions.map((_, index) => insightAt(questions, selfAnswers, friendAverages, index));
  const ranked = [...insights].sort((left, right) => left.difference - right.difference);

  return {
    mostAligned: ranked[0] ?? insightAt(questions, selfAnswers, friendAverages, 0),
    mostDifferent: ranked[ranked.length - 1] ?? insightAt(questions, selfAnswers, friendAverages, 0),
  };
}

export function describeInsightDifference(insight: PerceptionInsight): string {
  if (insight.difference === 0) {
    return '나와 친구들이 같은 점수로 봤어요.';
  }

  if (insight.friendScore > insight.selfScore) {
    return `친구들이 나보다 ${insight.difference.toFixed(1)}점 높게 봤어요.`;
  }

  return `내가 친구들보다 ${insight.difference.toFixed(1)}점 높게 봤어요.`;
}
