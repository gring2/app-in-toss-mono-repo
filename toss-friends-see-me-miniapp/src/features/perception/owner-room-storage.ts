import { Storage } from '@apps-in-toss/framework';
import { brandConfig } from '../../../brand.config';
import type { CreatedRoom } from '../../lib/supabase/perception-api';

const OWNER_ROOM_V1_KEY = `${brandConfig.appName}:owner-room:v1`;
const OWNER_ROOM_V2_KEY = `${brandConfig.appName}:owner-rooms:v2`;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface OwnerRoomSnapshot {
  displayName: string;
  room: CreatedRoom;
  createdAt?: string;
}

function isOwnerRoomSnapshot(value: unknown): value is OwnerRoomSnapshot {
  if (value == null || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OwnerRoomSnapshot>;
  return (
    typeof candidate.displayName === 'string' &&
    candidate.room != null &&
    typeof candidate.room.roomId === 'string' &&
    typeof candidate.room.inviteToken === 'string' &&
    typeof candidate.room.expiresAt === 'string' &&
    (candidate.createdAt == null || typeof candidate.createdAt === 'string')
  );
}

function isValidDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function deriveCreatedAt(expiresAt: string): string {
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) {
    return new Date().toISOString();
  }

  return new Date(expiresAtMs - THIRTY_DAYS_MS).toISOString();
}

function normalizeSnapshot(snapshot: OwnerRoomSnapshot): OwnerRoomSnapshot | null {
  if (!isOwnerRoomSnapshot(snapshot) || !isValidDate(snapshot.room.expiresAt)) {
    return null;
  }

  const expiresAtMs = Date.parse(snapshot.room.expiresAt);
  if (expiresAtMs <= Date.now()) {
    return null;
  }

  return {
    displayName: snapshot.displayName,
    room: snapshot.room,
    createdAt: snapshot.createdAt != null && isValidDate(snapshot.createdAt)
      ? snapshot.createdAt
      : deriveCreatedAt(snapshot.room.expiresAt),
  };
}

function upsertSnapshot(
  snapshots: readonly OwnerRoomSnapshot[],
  snapshot: OwnerRoomSnapshot
): OwnerRoomSnapshot[] {
  const next = [snapshot, ...snapshots.filter((item) => item.room.roomId !== snapshot.room.roomId)];
  next.sort((left, right) => Date.parse(right.createdAt ?? '') - Date.parse(left.createdAt ?? ''));
  return next;
}

function parseV2Snapshots(serialized: string | null): OwnerRoomSnapshot[] | null {
  if (serialized == null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed
      .map((item) => normalizeSnapshot(item as OwnerRoomSnapshot))
      .filter((item): item is OwnerRoomSnapshot => item != null)
      .sort((left, right) => Date.parse(right.createdAt ?? '') - Date.parse(left.createdAt ?? ''));
  } catch {
    return null;
  }
}

async function persistSnapshots(snapshots: readonly OwnerRoomSnapshot[]): Promise<void> {
  if (snapshots.length === 0) {
    await Storage.removeItem(OWNER_ROOM_V2_KEY);
    return;
  }

  await Storage.setItem(OWNER_ROOM_V2_KEY, JSON.stringify(snapshots));
}

export async function loadOwnerRoomSnapshots(): Promise<OwnerRoomSnapshot[]> {
  const v2Serialized = await Storage.getItem(OWNER_ROOM_V2_KEY);
  const v1Serialized = await Storage.getItem(OWNER_ROOM_V1_KEY);

  const parsedV2 = parseV2Snapshots(v2Serialized);
  let nextSnapshots = parsedV2 ?? [];
  let shouldRewriteV2 =
    parsedV2 == null ||
    (v2Serialized != null && v2Serialized !== JSON.stringify(parsedV2));
  const shouldClearV1 = v1Serialized != null;

  if (v1Serialized != null) {
    try {
      const parsed: unknown = JSON.parse(v1Serialized);
      if (isOwnerRoomSnapshot(parsed)) {
        const migratedSnapshot = normalizeSnapshot(parsed);
        if (migratedSnapshot != null) {
          nextSnapshots = upsertSnapshot(nextSnapshots, migratedSnapshot);
          shouldRewriteV2 = true;
        }
      } else {
        shouldRewriteV2 = shouldRewriteV2 || parsedV2 == null;
      }
    } catch {
      shouldRewriteV2 = shouldRewriteV2 || parsedV2 == null;
    }
  }

  if (parsedV2 != null && parsedV2.length !== nextSnapshots.length) {
    shouldRewriteV2 = true;
  }

  if (shouldRewriteV2) {
    await persistSnapshots(nextSnapshots);
  }

  if (shouldClearV1) {
    await Storage.removeItem(OWNER_ROOM_V1_KEY);
  }

  if (parsedV2 == null && nextSnapshots.length === 0) {
    await Storage.removeItem(OWNER_ROOM_V2_KEY);
  }

  return nextSnapshots;
}

export async function saveOwnerRoomSnapshot(snapshot: OwnerRoomSnapshot): Promise<void> {
  const normalizedSnapshot = normalizeSnapshot(snapshot);
  if (normalizedSnapshot == null) {
    return;
  }

  const snapshots = await loadOwnerRoomSnapshots();
  const nextSnapshots = upsertSnapshot(snapshots, normalizedSnapshot);
  await persistSnapshots(nextSnapshots);
  await Storage.removeItem(OWNER_ROOM_V1_KEY);
}

export async function removeOwnerRoomSnapshot(roomId: string): Promise<void> {
  await removeOwnerRoomSnapshots([roomId]);
}

export async function removeOwnerRoomSnapshots(roomIds: readonly string[]): Promise<void> {
  const roomIdSet = new Set(roomIds);
  const snapshots = await loadOwnerRoomSnapshots();
  const nextSnapshots = snapshots.filter((snapshot) => !roomIdSet.has(snapshot.room.roomId));
  await persistSnapshots(nextSnapshots);
}
