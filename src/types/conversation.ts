import type { Message } from './message.ts';

// ─── 대화 ──────────────────────────────────────────────────────────────────
export type ConversationIconType = 'message' | 'code' | 'languages' | 'avatar';

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  messages: Message[];
  time: string;
  createdAt?: number; // Unix timestamp (ms) — 상대 시간 표기 및 기간 삭제에 사용
  iconType: ConversationIconType;
  pinned?: boolean;
  /** 이 대화를 시작한 프롬프트 ID (없으면 일반 대화) */
  promptId?: string;
}
