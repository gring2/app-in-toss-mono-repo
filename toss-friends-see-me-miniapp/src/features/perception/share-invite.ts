import { getTossShareLink, share } from '@apps-in-toss/framework';
import { brandConfig } from '../../../brand.config';

export function buildInviteDeepLink(inviteToken: string): string {
  return `intoss://${brandConfig.appName}/invite?token=${encodeURIComponent(inviteToken)}`;
}

export async function shareInvite(displayName: string, inviteToken: string): Promise<void> {
  const tossLink = await getTossShareLink(buildInviteDeepLink(inviteToken), brandConfig.thumbnailUrl);

  await share({
    message: `${displayName}님을 나는 어떻게 보고 있을까요? 친구렌즈에서 익명으로 알려주세요.\n${tossLink}`,
  });
}
