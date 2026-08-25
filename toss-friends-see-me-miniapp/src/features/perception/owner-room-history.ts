import {
  getRoomResult,
  listOwnerRooms,
  type OwnerRoomSummary,
  type PerceptionResult,
} from '../../lib/supabase/perception-api';
import { loadOwnerRoomSnapshots, removeOwnerRoomSnapshots } from './owner-room-storage';
import type { QuestionDraft, SurveyQuestion } from './questions';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface OwnerRoomHistoryItem extends OwnerRoomSummary {
  inviteToken?: string;
}

export interface ActiveRoom {
  roomId: string;
  inviteToken?: string;
  expiresAt: string;
}

export function deriveCreatedAt(expiresAt: string): string {
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) {
    return new Date().toISOString();
  }

  return new Date(expiresAtMs - THIRTY_DAYS_MS).toISOString();
}

export function sortHistoryItems(items: readonly OwnerRoomHistoryItem[]): OwnerRoomHistoryItem[] {
  return [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function upsertHistoryItem(
  items: readonly OwnerRoomHistoryItem[],
  item: OwnerRoomHistoryItem
): OwnerRoomHistoryItem[] {
  return sortHistoryItems([item, ...items.filter((current) => current.roomId !== item.roomId)]);
}

export function formatHistoryDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR');
}

export function draftsToSurveyQuestions(questions: readonly QuestionDraft[]): SurveyQuestion[] {
  return questions.map((question) => ({
    prompt: question.prompt.trim(),
    ...(question.imageBase64 == null
      ? {}
      : { imageUri: `data:image/jpeg;base64,${question.imageBase64}` }),
  }));
}

export function updateHistoryItemWithResult(
  item: OwnerRoomHistoryItem,
  result: PerceptionResult,
  fallbackDisplayName: string
): OwnerRoomHistoryItem {
  return {
    ...item,
    displayName: result.displayName ?? fallbackDisplayName,
    expiresAt: result.expiresAt ?? item.expiresAt,
    responseCount: result.responseCount,
    requiredCount: result.requiredCount,
    revealed: result.revealed,
  };
}

async function buildFallbackHistoryItems(
  snapshots: Awaited<ReturnType<typeof loadOwnerRoomSnapshots>>
): Promise<OwnerRoomHistoryItem[]> {
  const settledResults: Array<OwnerRoomHistoryItem | null> = await Promise.all(
    snapshots.map(async (snapshot) => {
      const result = await getRoomResult(snapshot.room.roomId);
      if (result == null) {
        return null;
      }

      return {
        roomId: snapshot.room.roomId,
        displayName: result.displayName ?? snapshot.displayName,
        createdAt: snapshot.createdAt ?? deriveCreatedAt(snapshot.room.expiresAt),
        expiresAt: result.expiresAt ?? snapshot.room.expiresAt,
        responseCount: result.responseCount,
        requiredCount: result.requiredCount,
        revealed: result.revealed,
        inviteToken: snapshot.room.inviteToken,
      } satisfies OwnerRoomHistoryItem;
    })
  );

  const staleRoomIds = snapshots
    .filter((_snapshot, index) => settledResults[index] == null)
    .map((snapshot) => snapshot.room.roomId);

  if (staleRoomIds.length > 0) {
    await removeOwnerRoomSnapshots(staleRoomIds);
  }

  return sortHistoryItems(
    settledResults.filter((item): item is OwnerRoomHistoryItem => item != null)
  );
}

export async function loadHistoryItems(
  snapshots: Awaited<ReturnType<typeof loadOwnerRoomSnapshots>>
): Promise<OwnerRoomHistoryItem[]> {
  const serverSummaries = await listOwnerRooms();
  const snapshotByRoomId = new Map(snapshots.map((snapshot) => [snapshot.room.roomId, snapshot]));
  const serverRoomIds = new Set(serverSummaries.map((summary) => summary.roomId));
  const unmatchedSnapshots = snapshots.filter((snapshot) => !serverRoomIds.has(snapshot.room.roomId));
  const fallbackHistoryItems = unmatchedSnapshots.length > 0
    ? await buildFallbackHistoryItems(unmatchedSnapshots)
    : [];

  return sortHistoryItems(
    [
      ...serverSummaries.map((summary) => ({
        ...summary,
        inviteToken: snapshotByRoomId.get(summary.roomId)?.room.inviteToken,
      })),
      ...fallbackHistoryItems,
    ]
  );
}
