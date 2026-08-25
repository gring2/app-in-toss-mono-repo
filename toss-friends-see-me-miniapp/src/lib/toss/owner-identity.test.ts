jest.mock('@apps-in-toss/framework', () => ({
  getAnonymousKey: jest.fn(),
}));

import { getAnonymousKey } from '@apps-in-toss/framework';
import { getOwnerIdentityKey, resetOwnerIdentityCacheForTest } from './owner-identity';

const getAnonymousKeyMock = getAnonymousKey as jest.MockedFunction<typeof getAnonymousKey>;

describe('owner identity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOwnerIdentityCacheForTest();
  });

  it('caches the Toss owner key after the first successful read', async () => {
    getAnonymousKeyMock.mockResolvedValue({
      type: 'HASH',
      hash: 'stable-owner-key',
    });

    await expect(getOwnerIdentityKey()).resolves.toBe('stable-owner-key');
    await expect(getOwnerIdentityKey()).resolves.toBe('stable-owner-key');

    expect(getAnonymousKeyMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces unsupported Toss versions clearly', async () => {
    getAnonymousKeyMock.mockResolvedValue(undefined);

    await expect(getOwnerIdentityKey()).rejects.toThrow('Toss 앱을 업데이트');
    expect(getAnonymousKeyMock).toHaveBeenCalledTimes(1);
  });

  it('retries after transient SDK errors instead of caching failures', async () => {
    getAnonymousKeyMock
      .mockResolvedValueOnce('ERROR')
      .mockResolvedValueOnce({
        type: 'HASH',
        hash: 'stable-owner-key',
      });

    await expect(getOwnerIdentityKey()).rejects.toThrow('식별키를 불러오지 못했어요');
    await expect(getOwnerIdentityKey()).resolves.toBe('stable-owner-key');

    expect(getAnonymousKeyMock).toHaveBeenCalledTimes(2);
  });
});
