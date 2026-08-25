import { ensureAnonymousSession, supabase } from './client';
import { getOwnerIdentityKey } from '../toss/owner-identity';
import {
  createDefaultSurveyQuestions,
  type QuestionDraft,
  type SurveyQuestion,
} from '../../features/perception/questions';

export type AnswerScore = 1 | 2 | 3 | 4 | 5;

export interface CreatedRoom {
  roomId: string;
  inviteToken: string;
  expiresAt: string;
}

export interface OwnerRoomSummary {
  roomId: string;
  displayName: string;
  createdAt: string;
  expiresAt: string;
  responseCount: number;
  requiredCount: number;
  revealed: boolean;
}

export interface InviteSummary {
  roomId: string;
  displayName: string;
  expiresAt: string;
  responseCount: number;
  questionCount: number;
  questions: SurveyQuestion[];
  alreadyAnswered: boolean;
  isOwner: boolean;
}

export interface WaitingResult {
  roomId: string;
  displayName?: string;
  expiresAt?: string;
  responseCount: number;
  requiredCount: number;
  questions: SurveyQuestion[];
  revealed: false;
}

export interface SubmissionReceipt {
  roomId: string;
  responseCount: number;
  requiredCount: number;
  revealed: boolean;
}

export interface RevealedResult {
  roomId: string;
  displayName: string;
  expiresAt: string;
  responseCount: number;
  requiredCount: number;
  questions: SurveyQuestion[];
  revealed: true;
  selfAnswers: number[];
  friendAverages: number[];
}

export type PerceptionResult = WaitingResult | RevealedResult;

function assertAnswerSet(answers: readonly AnswerScore[]): void {
  if (answers.length !== 8 || answers.some((answer) => answer < 1 || answer > 5)) {
    throw new Error('1점부터 5점까지의 답변 8개가 필요해요.');
  }
}

function assertQuestionSet(questions: readonly QuestionDraft[]): void {
  if (
    questions.length !== 8 ||
    questions.some((question) => {
      const promptLength = question.prompt.trim().length;
      return promptLength < 1 || promptLength > 60;
    })
  ) {
    throw new Error('1자부터 60자까지의 질문 8개가 필요해요.');
  }

  const images = questions.filter((question) => question.imageBase64 != null);
  if (images.length > 3 || images.some((question) => (question.imageBase64?.length ?? 0) > 400_000)) {
    throw new Error('질문 이미지는 최대 3장, 장당 300KB까지 넣을 수 있어요.');
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || Array.isArray(value) || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Supabase 응답에 ${field} 값이 없어요.`);
  }

  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number') {
    throw new Error(`Supabase 응답에 ${field} 값이 없어요.`);
  }

  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Supabase 응답에 ${field} 값이 없어요.`);
  }

  return value;
}

function requireNumberArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'number')) {
    throw new Error(`Supabase 응답의 ${field} 값이 올바르지 않아요.`);
  }

  return value as number[];
}

function optionalStringArray(value: unknown): Array<string | null> | null {
  if (!Array.isArray(value) || value.some((item) => item != null && typeof item !== 'string')) {
    return null;
  }

  return value as Array<string | null>;
}

function mapSurveyQuestions(record: Record<string, unknown>): SurveyQuestion[] {
  const prompts = optionalStringArray(record.questions);
  if (prompts == null || prompts.length !== 8 || prompts.some((prompt) => prompt == null)) {
    return createDefaultSurveyQuestions();
  }

  const images = optionalStringArray(record.question_images);
  return prompts.map((prompt, index) => {
    const imageBase64 = images?.[index];
    return {
      prompt: prompt ?? '',
      ...(imageBase64 == null || imageBase64.length === 0
        ? {}
        : { imageUri: `data:image/jpeg;base64,${imageBase64}` }),
    };
  });
}

export async function createRoom(
  displayName: string,
  questions: readonly QuestionDraft[],
  selfAnswers: readonly AnswerScore[]
): Promise<CreatedRoom> {
  assertQuestionSet(questions);
  assertAnswerSet(selfAnswers);
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('create_perception_room_v4', {
    p_display_name: displayName,
    p_owner_key: ownerKey,
    p_self_answers: [...selfAnswers],
    p_questions: questions.map((question) => question.prompt.trim()),
    p_question_images: questions.map((question) => question.imageBase64 ?? null),
  });

  if (error != null) {
    throw error;
  }

  const room = data?.[0];
  if (room == null) {
    throw new Error('방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
  }

  return {
    roomId: room.room_id,
    inviteToken: room.invite_token,
    expiresAt: room.expires_at,
  };
}

export async function listOwnerRooms(): Promise<OwnerRoomSummary[]> {
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('list_perception_rooms_v2', {
    p_owner_key: ownerKey,
  });

  if (error != null) {
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error('방 목록을 불러오지 못했어요.');
  }

  return data.map((room) => {
    const record = asRecord(room);
    if (record == null) {
      throw new Error('방 목록 응답이 올바르지 않아요.');
    }

    return {
      roomId: requireString(record.room_id, 'room_id'),
      displayName: requireString(record.display_name, 'display_name'),
      createdAt: requireString(record.created_at, 'created_at'),
      expiresAt: requireString(record.expires_at, 'expires_at'),
      responseCount: requireNumber(record.response_count, 'response_count'),
      requiredCount: requireNumber(record.required_count, 'required_count'),
      revealed: requireBoolean(record.revealed, 'revealed'),
    };
  });
}

export async function getInvite(inviteToken: string): Promise<InviteSummary | null> {
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('get_perception_invite_v2', {
    p_invite_token: inviteToken,
    p_owner_key: ownerKey,
  });

  if (error != null) {
    throw error;
  }

  const record = asRecord(data);
  if (record == null) {
    return null;
  }

  return {
    roomId: requireString(record.room_id, 'room_id'),
    displayName: requireString(record.display_name, 'display_name'),
    expiresAt: requireString(record.expires_at, 'expires_at'),
    responseCount: requireNumber(record.response_count, 'response_count'),
    questionCount: requireNumber(record.question_count, 'question_count'),
    questions: mapSurveyQuestions(record),
    alreadyAnswered: requireBoolean(record.already_answered, 'already_answered'),
    isOwner: requireBoolean(record.is_owner, 'is_owner'),
  };
}

export async function submitFriendResponse(
  inviteToken: string,
  answers: readonly AnswerScore[]
): Promise<SubmissionReceipt> {
  assertAnswerSet(answers);
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('submit_perception_response_v2', {
    p_invite_token: inviteToken,
    p_answers: [...answers],
    p_owner_key: ownerKey,
  });

  if (error != null) {
    throw error;
  }

  const record = asRecord(data);
  if (record == null) {
    throw new Error('응답 결과를 확인하지 못했어요.');
  }

  return {
    roomId: requireString(record.room_id, 'room_id'),
    responseCount: requireNumber(record.response_count, 'response_count'),
    requiredCount: requireNumber(record.required_count, 'required_count'),
    revealed: requireBoolean(record.revealed, 'revealed'),
  };
}

export async function getRoomResult(roomId: string): Promise<PerceptionResult | null> {
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('get_perception_results_v2', {
    p_owner_key: ownerKey,
    p_room_id: roomId,
  });

  if (error != null) {
    throw error;
  }

  const record = asRecord(data);
  if (record == null) {
    return null;
  }

  const revealed = requireBoolean(record.revealed, 'revealed');
  const base = {
    roomId: requireString(record.room_id, 'room_id'),
    responseCount: requireNumber(record.response_count, 'response_count'),
    requiredCount: requireNumber(record.required_count, 'required_count'),
    questions: mapSurveyQuestions(record),
  };

  if (!revealed) {
    return {
      ...base,
      displayName: typeof record.display_name === 'string' ? record.display_name : undefined,
      expiresAt: typeof record.expires_at === 'string' ? record.expires_at : undefined,
      revealed: false,
    };
  }

  return {
    ...base,
    displayName: requireString(record.display_name, 'display_name'),
    expiresAt: requireString(record.expires_at, 'expires_at'),
    revealed: true,
    selfAnswers: requireNumberArray(record.self_answers, 'self_answers'),
    friendAverages: requireNumberArray(record.friend_averages, 'friend_averages'),
  };
}

export async function rotateInvite(roomId: string): Promise<Omit<CreatedRoom, 'roomId'>> {
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('rotate_perception_invite_v2', {
    p_owner_key: ownerKey,
    p_room_id: roomId,
  });

  if (error != null) {
    throw error;
  }

  const invitation = data?.[0];
  if (invitation == null) {
    throw new Error('초대 링크를 다시 만들지 못했어요.');
  }

  return {
    inviteToken: invitation.invite_token,
    expiresAt: invitation.expires_at,
  };
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  await ensureAnonymousSession();
  const ownerKey = await getOwnerIdentityKey();

  const { data, error } = await supabase.rpc('delete_perception_room_v2', {
    p_owner_key: ownerKey,
    p_room_id: roomId,
  });

  if (error != null) {
    throw error;
  }

  return data;
}
