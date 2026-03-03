import type { Conversation } from './conversation.ts';
import type { AIProvider, GeminiModel } from './ai.ts';

// ─── 앱 전역 상태 ──────────────────────────────────────────────────────────
/** State 패턴: 앱 뷰 상태를 명시적 유니온 타입으로 관리 */
export type AppView = 'welcome' | 'chat' | 'prompt' | 'prompts-list';

export interface AppState {
  conversations: Conversation[];
  activeId: string | null;
  /** 'prompt' 뷰일 때 선택된 프롬프트 ID */
  activePromptId: string | null;
  view: AppView;
  isSidebarOpen: boolean;
  isStreaming: boolean;
  /** 에티켓 모드: 세션(convId)별 ON/OFF 상태 */
  etiquetteMap: Record<string, boolean>;
  /** 선택된 AI 서비스 제공자 (상대 AI) */
  aiProvider: AIProvider;
  /** 선택된 Gemini 모델 (상대 AI) */
  geminiModel: GeminiModel;
  /** 에티켓 AI 서비스 제공자 (문장 교정용) */
  etiquetteProvider: AIProvider;
  /** 에티켓 AI Gemini 모델 */
  etiquetteGeminiModel: GeminiModel;
  /** 에티켓 모드: AI 답변 후 생성된 선택지 */
  suggestedReplies: string[] | null;
}
