import { getNetworkAwareErrorMessage, getOwnerFlowErrorMessage } from './error-messages';

describe('perception error messages', () => {
  it('maps network failures to a retryable message', () => {
    expect(getNetworkAwareErrorMessage(new Error('Failed to fetch'), 'fallback')).toBe(
      '인터넷 연결을 확인하고 다시 시도해 주세요.'
    );
  });

  it('preserves actionable Toss identity failures only in the owner flow', () => {
    const error = new Error('Toss 식별키를 불러오지 못했어요.');
    expect(getOwnerFlowErrorMessage(error, 'fallback')).toBe(error.message);
    expect(getNetworkAwareErrorMessage(error, 'fallback')).toBe('fallback');
  });
});
