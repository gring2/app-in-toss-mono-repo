import { getOperationalEnvironment } from '@apps-in-toss/framework';

export function resolveRnAdEnvironment() {
  try {
    return getOperationalEnvironment();
  } catch {
    return 'sandbox';
  }
}
