import { getOperationalEnvironment, getTossAppVersion } from '@apps-in-toss/web-framework';

export function resolveWebviewAdEnvironment() {
  try {
    return getOperationalEnvironment();
  } catch {
    return 'sandbox';
  }
}

export function getWebviewTossVersion() {
  try {
    return getTossAppVersion();
  } catch {
    return '0.0.0';
  }
}
