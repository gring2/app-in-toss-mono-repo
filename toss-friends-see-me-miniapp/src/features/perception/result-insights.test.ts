import { describeInsightDifference, getPerceptionInsights } from './result-insights';
import { createDefaultSurveyQuestions } from './questions';

describe('perception result insights', () => {
  it('finds the closest and largest perception gaps', () => {
    const insights = getPerceptionInsights(
      createDefaultSurveyQuestions(),
      [3, 5, 2, 4, 1, 3, 5, 4],
      [3, 4, 5, 4, 2, 3, 4, 4]
    );

    expect(insights.mostAligned).toMatchObject({
      question: '단톡방이 조용해지면 먼저 웃긴 이야기를 꺼낼 것 같다',
      difference: 0,
    });
    expect(insights.mostDifferent).toMatchObject({
      question: '여행을 가면 맛집이나 놀거리를 누구보다 빨리 찾을 것 같다',
      selfScore: 2,
      friendScore: 5,
      difference: 3,
    });
  });

  it('describes equal, higher friend, and higher self scores without exposing individuals', () => {
    expect(describeInsightDifference({ question: '', selfScore: 4, friendScore: 4, difference: 0 })).toBe(
      '나와 친구들이 같은 점수로 봤어요.'
    );
    expect(describeInsightDifference({ question: '', selfScore: 3, friendScore: 4.5, difference: 1.5 })).toBe(
      '친구들이 나보다 1.5점 높게 봤어요.'
    );
    expect(describeInsightDifference({ question: '', selfScore: 5, friendScore: 3, difference: 2 })).toBe(
      '내가 친구들보다 2.0점 높게 봤어요.'
    );
  });
});
