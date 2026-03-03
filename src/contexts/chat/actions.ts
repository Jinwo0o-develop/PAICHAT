import type {
  Conversation,
  Message,
  AIProvider,
  GeminiModel,
} from '../../types/index.ts';

// ─── Observer 패턴: 액션 이벤트 정의 ─────────────────────────────────────────

export type ChatAction =
  | { type: 'START_CONVERSATION'; conversation: Conversation }
  | { type: 'SELECT_CONVERSATION'; id: string }
  | { type: 'SELECT_PROMPT'; promptId: string }
  | { type: 'SELECT_PROMPTS_LIST' }
  | { type: 'NEW_CHAT' }
  | { type: 'DELETE_CONVERSATION'; id: string }
  | { type: 'DELETE_CONVERSATIONS_BEFORE'; cutoffMs: number }
  | { type: 'PIN_CONVERSATION'; id: string }
  | { type: 'RENAME_CONVERSATION'; id: string; title: string }
  | { type: 'APPEND_TOKEN'; convId: string; msgId: string; token: string }
  | { type: 'FINISH_STREAMING'; convId: string; msgId: string }
  | { type: 'CANCEL_STREAMING'; convId: string; msgId: string }
  | { type: 'STREAM_ERROR'; convId: string; msgId: string; error: string }
  | { type: 'ADD_MESSAGES'; convId: string; userMsg: Message; aiMsg: Message }
  | { type: 'ADD_AI_MESSAGE'; convId: string; aiMsg: Message }
  | { type: 'REPLACE_FROM_MSG'; convId: string; msgIndex: number; userMsg: Message; aiMsg: Message }
  | { type: 'UPDATE_REWRITTEN_CONTENT'; convId: string; msgId: string; content: string }
  | { type: 'TOGGLE_ETIQUETTE'; convId: string }
  | { type: 'SET_SUGGESTIONS'; convId: string; replies: string[] }
  | { type: 'CLEAR_SUGGESTIONS' }
  | { type: 'SET_MODEL'; provider: AIProvider; geminiModel: GeminiModel }
  | { type: 'SET_ETIQUETTE_MODEL'; provider: AIProvider; geminiModel: GeminiModel }
  | { type: 'RATE_MESSAGE'; convId: string; msgId: string; rating: 'good' | 'bad' | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_STREAMING'; value: boolean };
