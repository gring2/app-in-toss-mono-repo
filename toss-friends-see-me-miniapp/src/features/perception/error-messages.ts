const NETWORK_ERROR_PATTERN = /failed to fetch|network request failed/i;
const TOSS_IDENTITY_ERROR_PATTERN = /Toss 앱|Toss 식별키/;

export function getNetworkAwareErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && NETWORK_ERROR_PATTERN.test(error.message)
    ? '인터넷 연결을 확인하고 다시 시도해 주세요.'
    : fallback;
}

export function getOwnerFlowErrorMessage(error: unknown, fallback: string): string {
  const networkAwareMessage = getNetworkAwareErrorMessage(error, fallback);
  if (networkAwareMessage !== fallback) {
    return networkAwareMessage;
  }

  return error instanceof Error && TOSS_IDENTITY_ERROR_PATTERN.test(error.message)
    ? error.message
    : fallback;
}
