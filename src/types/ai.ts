// ─── AI 서비스 관련 타입 ─────────────────────────────────────────────────────

export type GeminiModel =
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-preview';

export type AIProvider = 'ollama' | 'gemini';

/**
 * 통합 채팅 메시지 포맷.
 * OllamaService / GeminiService 모두 이 타입을 입력으로 받는다.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** 첨부 이미지 base64 (data: prefix 제외) */
  imageBase64?: string;
  /** 이미지 MIME 타입 (예: 'image/jpeg') */
  imageMime?: string;
}
