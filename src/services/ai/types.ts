import type { ChatMessage } from '../../types/ai.ts';

/**
 * Strategy 패턴: AI 서비스 공통 인터페이스.
 * Ollama, Gemini 등 서로 다른 AI 백엔드를 동일한 인터페이스로 사용할 수 있게 한다.
 */
export interface AIServiceStrategy {
  /** 단발성 완성 요청 (스트리밍 없음) */
  complete(messages: ChatMessage[]): Promise<string>;

  /** 스트리밍 채팅 요청. AbortController를 반환하여 취소 지원. */
  streamChat(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
  ): AbortController;
}

/** 스트리밍 콜백 세트 */
export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}
