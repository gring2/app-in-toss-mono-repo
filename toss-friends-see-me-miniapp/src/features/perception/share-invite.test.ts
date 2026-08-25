jest.mock('@apps-in-toss/framework', () => ({
  getTossShareLink: jest.fn(),
  share: jest.fn(),
}));

import { getTossShareLink, share } from '@apps-in-toss/framework';
import { brandConfig } from '../../../brand.config';
import { buildInviteDeepLink, shareInvite } from './share-invite';

const getTossShareLinkMock = getTossShareLink as jest.MockedFunction<typeof getTossShareLink>;
const shareMock = share as jest.MockedFunction<typeof share>;

describe('invite sharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTossShareLinkMock.mockResolvedValue('https://toss.im/_ul/friend-lens');
    shareMock.mockResolvedValue();
  });

  it('builds the registered deep link and shares it with the hosted thumbnail', async () => {
    expect(buildInviteDeepLink('a b')).toBe('intoss://friend-lens/invite?token=a%20b');

    await shareInvite('민준', 'token-1');

    expect(getTossShareLinkMock).toHaveBeenCalledWith(
      'intoss://friend-lens/invite?token=token-1',
      brandConfig.thumbnailUrl
    );
    expect(shareMock).toHaveBeenCalledWith({
      message: '민준님을 나는 어떻게 보고 있을까요? 친구렌즈에서 익명으로 알려주세요.\nhttps://toss.im/_ul/friend-lens',
    });
  });
});
