import type { Conversation } from '../types/conversation.ts';
import type { AIProvider, GeminiModel } from '../types/ai.ts';

const CONV_KEY = 'pai_chat_conversations';
const ACTIVE_KEY = 'pai_chat_active_id';
const AI_SETTINGS_KEY = 'pai_chat_ai_settings';
const ETIQUETTE_AI_KEY = 'pai_chat_etiquette_ai_settings';

/**
 * localStorage 저장 전 정리:
 * - isStreaming 플래그 제거
 * - 빈 AI 메시지(스트리밍 도중 새로고침) 제거
 * - 첨부파일 preview(base64) 제거 -> 5MB 한도 대비
 */
function sanitize(conversations: Conversation[]): Conversation[] {
  return conversations.map((c) => ({
    ...c,
    messages: c.messages
      .filter((m) => !(m.isStreaming && !m.content))
      .map((m) => ({
        ...m,
        isStreaming: false,
        attachments: m.attachments?.map(({ preview: _preview, ...rest }) => rest),
      })),
  }));
}

/**
 * Singleton 패턴: localStorage 접근을 단일 인스턴스로 집중 관리.
 * 향후 IndexedDB / RemoteSync 등으로 교체 시 이 클래스만 수정.
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  loadConversations(fallback: Conversation[]): Conversation[] {
    try {
      const raw = localStorage.getItem(CONV_KEY);
      if (raw) return JSON.parse(raw) as Conversation[];
    } catch {}
    return fallback;
  }

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(CONV_KEY, JSON.stringify(sanitize(conversations)));
    } catch (e) {
      console.warn('[PAI Chat] 대화 저장 실패 (용량 초과 가능성):', e);
    }
  }

  loadActiveId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  }

  saveActiveId(id: string | null): void {
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }

  loadAISettings(): { provider: AIProvider; geminiModel: GeminiModel } {
    try {
      const raw = localStorage.getItem(AI_SETTINGS_KEY);
      if (raw) return JSON.parse(raw) as { provider: AIProvider; geminiModel: GeminiModel };
    } catch {}
    return { provider: 'gemini', geminiModel: 'gemini-2.5-flash' };
  }

  saveAISettings(provider: AIProvider, geminiModel: GeminiModel): void {
    try {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify({ provider, geminiModel }));
    } catch {}
  }

  loadEtiquetteAISettings(): { provider: AIProvider; geminiModel: GeminiModel } {
    try {
      const raw = localStorage.getItem(ETIQUETTE_AI_KEY);
      if (raw) return JSON.parse(raw) as { provider: AIProvider; geminiModel: GeminiModel };
    } catch {}
    return { provider: 'gemini', geminiModel: 'gemini-2.5-flash-lite' };
  }

  saveEtiquetteAISettings(provider: AIProvider, geminiModel: GeminiModel): void {
    try {
      localStorage.setItem(ETIQUETTE_AI_KEY, JSON.stringify({ provider, geminiModel }));
    } catch {}
  }
}
