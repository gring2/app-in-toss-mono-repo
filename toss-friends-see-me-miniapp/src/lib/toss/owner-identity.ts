import { getAnonymousKey } from '@apps-in-toss/framework';

const UNSUPPORTED_OWNER_IDENTITY_MESSAGE =
  '이 버전의 Toss 앱에서는 내 방을 불러올 수 없어요. Toss 앱을 업데이트한 뒤 다시 시도해 주세요.';
const UNAVAILABLE_OWNER_IDENTITY_MESSAGE = 'Toss 식별키를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

let cachedOwnerKey: string | null = null;
let pendingOwnerKey: Promise<string> | null = null;

function normalizeOwnerKey(hash: unknown): string {
  if (typeof hash !== 'string' || hash.length === 0) {
    throw new Error(UNAVAILABLE_OWNER_IDENTITY_MESSAGE);
  }

  return hash;
}

export async function getOwnerIdentityKey(): Promise<string> {
  if (cachedOwnerKey != null) {
    return cachedOwnerKey;
  }

  if (pendingOwnerKey == null) {
    pendingOwnerKey = getAnonymousKey()
      .then((result) => {
        if (result == null) {
          throw new Error(UNSUPPORTED_OWNER_IDENTITY_MESSAGE);
        }

        if (result === 'ERROR') {
          throw new Error(UNAVAILABLE_OWNER_IDENTITY_MESSAGE);
        }

        if (result.type !== 'HASH') {
          throw new Error(UNAVAILABLE_OWNER_IDENTITY_MESSAGE);
        }

        const ownerKey = normalizeOwnerKey(result.hash);
        cachedOwnerKey = ownerKey;
        return ownerKey;
      })
      .finally(() => {
        pendingOwnerKey = null;
      });
  }

  return pendingOwnerKey;
}

export function resetOwnerIdentityCacheForTest(): void {
  cachedOwnerKey = null;
  pendingOwnerKey = null;
}
