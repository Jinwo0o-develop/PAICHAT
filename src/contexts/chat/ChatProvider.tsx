import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  AppState,
  AppView,
  Conversation,
  Message,
  AttachedFile,
  AIProvider,
  GeminiModel,
  ChatMessage,
} from '../../types/index.ts';
import { INITIAL_CONVERSATIONS } from '../../constants/initialData.ts';
import { StorageService } from '../../services/StorageService.ts';
import { AIServiceFactory, OLLAMA_MODEL } from '../../services/ai/index.ts';
import { chatReducer } from './reducer.ts';
import type { ChatAction } from './actions.ts';
import { now } from '../../lib/time.ts';
import { generateId } from '../../lib/id.ts';

// ─── Context 인터페이스 ───────────────────────────────────────────────────────

interface ChatContextValue {
  state: AppState;
  dispatch: Dispatch<ChatAction>;
  startChat: (input: string, files?: AttachedFile[], systemPrompt?: string, promptId?: string) => void;
  sendMessage: (content: string, files?: AttachedFile[]) => Promise<void>;
  cancelStreaming: () => void;
  editMessage: (msgId: string, newContent: string) => void;
  proactiveMessage: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── 초기 상태 복원 ───────────────────────────────────────────────────────────

const storage = StorageService.getInstance();

function buildInitialState(): AppState {
  const conversations = storage.loadConversations(INITIAL_CONVERSATIONS);
  const savedId = storage.loadActiveId();
  const activeId = savedId && conversations.find((c) => c.id === savedId) ? savedId : null;
  const view: AppView = activeId ? 'chat' : 'welcome';
  const { provider: aiProvider, geminiModel } = storage.loadAISettings();
  const { provider: etiquetteProvider, geminiModel: etiquetteGeminiModel } =
    storage.loadEtiquetteAISettings();
  return {
    conversations,
    activeId,
    activePromptId: null,
    view,
    isSidebarOpen: true,
    isStreaming: false,
    etiquetteMap: {},
    aiProvider,
    geminiModel,
    etiquetteProvider,
    etiquetteGeminiModel,
    suggestedReplies: null,
  };
}

/** AI provider + model 조합에서 표시 이름을 결정 */
function resolveModelName(provider: AIProvider, geminiModel: GeminiModel): string {
  return provider === 'gemini' ? geminiModel : OLLAMA_MODEL;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, undefined, buildInitialState);
  const abortRef = useRef<AbortController | null>(null);
  const isCancellingRef = useRef(false);
  const streamingMsgRef = useRef<{ convId: string; msgId: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 자동 저장 (디바운스) ──────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      storage.saveConversations(state.conversations);
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.conversations]);

  useEffect(() => { storage.saveActiveId(state.activeId); }, [state.activeId]);

  useEffect(() => {
    storage.saveAISettings(state.aiProvider, state.geminiModel);
  }, [state.aiProvider, state.geminiModel]);

  useEffect(() => {
    storage.saveEtiquetteAISettings(state.etiquetteProvider, state.etiquetteGeminiModel);
  }, [state.etiquetteProvider, state.etiquetteGeminiModel]);

  // ── 스트리밍 실행 (Command 패턴) ─────────────────────────────────────
  const executeStreaming = useCallback(
    (
      convId: string,
      aiMsgId: string,
      history: ChatMessage[],
      provider: AIProvider,
      gModel: GeminiModel,
      afterDone?: (aiResponse: string) => void,
    ) => {
      abortRef.current?.abort();
      dispatch({ type: 'SET_STREAMING', value: true });
      streamingMsgRef.current = { convId, msgId: aiMsgId };

      const service = AIServiceFactory.getService(provider, gModel);

      // 스트리밍 응답 누적 (제목 생성 등 afterDone에서 활용)
      let accumulated = '';
      const onToken = (token: string) => {
        if (isCancellingRef.current) return; // 취소 후 토큰 무시
        accumulated += token;
        dispatch({ type: 'APPEND_TOKEN', convId, msgId: aiMsgId, token });
      };
      const onDone = () => {
        streamingMsgRef.current = null;
        dispatch({ type: 'FINISH_STREAMING', convId, msgId: aiMsgId });
        afterDone?.(accumulated);
      };
      const onError = (_err: Error) => {
        streamingMsgRef.current = null;
        if (isCancellingRef.current) {
          isCancellingRef.current = false;
          return; // cancelStreaming()에서 이미 CANCEL_STREAMING 처리
        }
        dispatch({ type: 'STREAM_ERROR', convId, msgId: aiMsgId, error: _err.message });
      };

      abortRef.current = service.streamChat(history, onToken, onDone, onError);
    },
    [],
  );

  // ── 새 대화 시작 ──────────────────────────────────────────────────────
  const startChat = useCallback(
    (input: string, files: AttachedFile[] = [], systemPrompt?: string, promptId?: string) => {
      const { isStreaming, aiProvider, geminiModel } = state;
      if (isStreaming) return;

      const t = now();
      const newId = generateId();
      const aiMsgId = generateId('ai');
      const modelName = resolveModelName(aiProvider, geminiModel);

      const conversation: Conversation = {
        id: newId,
        title: input.length > 28 ? input.slice(0, 28) + '\u2026' : input,
        preview: input,
        createdAt: Date.now(),
        promptId,
        messages: [
          {
            id: 'u0',
            role: 'user',
            content: input,
            time: t,
            attachments: files.length > 0 ? files : undefined,
          },
          { id: aiMsgId, role: 'ai', content: '', time: t, model: modelName, isStreaming: true },
        ],
        time: t,
        iconType: 'avatar',
      };

      dispatch({ type: 'START_CONVERSATION', conversation });

      const history: ChatMessage[] = [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user', content: input },
      ];

      // 스트리밍 완료 후 사용자 입력 + AI 응답 기반 제목 자동 생성
      const afterDone = (aiResponse: string) => {
        void (async () => {
          try {
            const titleService = AIServiceFactory.getService(aiProvider, geminiModel);
            const titlePrompt: ChatMessage[] = [
              {
                role: 'user',
                content: [
                  '아래 대화의 핵심 내용을 담은 짧은 제목(15자 이내)을 만들어주세요.',
                  '규칙: 제목만 출력하세요. 따옴표·번호·설명은 절대 넣지 마세요.',
                  '',
                  `사용자: ${input}`,
                  `AI: ${aiResponse.slice(0, 300)}`,
                ].join('\n'),
              },
            ];
            const raw = await titleService.complete(titlePrompt);
            const title = raw.trim().replace(/^["'「『]|["'」』]$/g, '').slice(0, 25);
            if (title) dispatch({ type: 'RENAME_CONVERSATION', id: newId, title });
          } catch { /* 제목 생성 실패 → 기존 트런케이트 제목 유지 */ }
        })();
      };

      executeStreaming(newId, aiMsgId, history, aiProvider, geminiModel, afterDone);
    },
    [state, executeStreaming],
  );

  // ── 메시지 전송 ──────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, files: AttachedFile[] = []): Promise<void> => {
      const { activeId, isStreaming, conversations, aiProvider, geminiModel } = state;
      if (!activeId || isStreaming) return;

      const t = now();
      const userMsgId = generateId();
      const aiMsgId = generateId('ai');
      const modelName = resolveModelName(aiProvider, geminiModel);

      const userMsg: Message = {
        id: userMsgId,
        role: 'user',
        content,
        time: t,
        attachments: files.length > 0 ? files : undefined,
      };
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'ai',
        content: '',
        time: t,
        model: modelName,
        isStreaming: true,
      };

      const currentConv = conversations.find((c) => c.id === activeId);
      const pastMessages = (currentConv?.messages ?? []).filter(
        (m) => !m.isStreaming && m.content,
      );

      dispatch({ type: 'ADD_MESSAGES', convId: activeId, userMsg, aiMsg });
      dispatch({ type: 'SET_STREAMING', value: true });

      // ── AI 응답 스트리밍 ────────────────────────────────────────────
      // 에티켓 모드의 문장 변환은 EtiquettePanel에서 처리하므로 여기서는 그대로 전송
      const history: ChatMessage[] = [
        ...pastMessages.map((m) => {
          const role = m.role === 'ai' ? ('assistant' as const) : ('user' as const);
          let msgContent = m.rewrittenContent ?? m.content;
          // 평가된 AI 메시지: 히스토리에 피드백 노트 추가 (화면 표시 X)
          if (m.role === 'ai' && m.rating) {
            msgContent += m.rating === 'good'
              ? '\n\n[사용자 피드백: 좋은 답변이었습니다. 이런 방식으로 계속해 주세요.]'
              : '\n\n[사용자 피드백: 개선이 필요한 답변이었습니다. 더 명확하고 도움이 되게 답변해 주세요.]';
          }
          return { role, content: msgContent };
        }),
        { role: 'user' as const, content },
      ];

      executeStreaming(activeId, aiMsgId, history, aiProvider, geminiModel);
    },
    [state, executeStreaming],
  );

  // ── 스트리밍 취소 ─────────────────────────────────────────────────────
  const cancelStreaming = useCallback(() => {
    if (!streamingMsgRef.current) return;
    isCancellingRef.current = true;
    abortRef.current?.abort();
    // 즉시 스트리밍 메시지 제거 (onError 비동기 콜백보다 먼저 UI 반영)
    dispatch({ type: 'CANCEL_STREAMING', ...streamingMsgRef.current });
    streamingMsgRef.current = null;
  }, []);

  // ── 메시지 수정 후 재생성 ──────────────────────────────────────────────
  const editMessage = useCallback(
    (msgId: string, newContent: string) => {
      const { activeId, conversations, aiProvider, geminiModel } = state;
      if (!activeId || !newContent.trim()) return;

      const conv = conversations.find((c) => c.id === activeId);
      if (!conv) return;

      const msgIndex = conv.messages.findIndex((m) => m.id === msgId);
      if (msgIndex === -1) return;

      const t = now();
      const aiMsgId = generateId('ai');
      const modelName = resolveModelName(aiProvider, geminiModel);

      const userMsg: Message = { id: msgId, role: 'user', content: newContent.trim(), time: t };
      const aiMsg: Message = { id: aiMsgId, role: 'ai', content: '', time: t, model: modelName, isStreaming: true };

      dispatch({ type: 'REPLACE_FROM_MSG', convId: activeId, msgIndex, userMsg, aiMsg });
      dispatch({ type: 'SET_STREAMING', value: true });

      const past = conv.messages
        .slice(0, msgIndex)
        .filter((m) => !m.isStreaming && m.content);
      const history: ChatMessage[] = [
        ...past.map((m) => {
          const role = m.role === 'ai' ? ('assistant' as const) : ('user' as const);
          let msgContent = m.content;
          if (m.role === 'ai' && m.rating) {
            msgContent += m.rating === 'good'
              ? '\n\n[사용자 피드백: 좋은 답변이었습니다. 이런 방식으로 계속해 주세요.]'
              : '\n\n[사용자 피드백: 개선이 필요한 답변이었습니다. 더 명확하고 도움이 되게 답변해 주세요.]';
          }
          return { role, content: msgContent };
        }),
        { role: 'user' as const, content: newContent.trim() },
      ];

      executeStreaming(activeId, aiMsgId, history, aiProvider, geminiModel);
    },
    [state, executeStreaming],
  );

  // ── 프로액티브 메시지 (심심함 감지) ───────────────────────────────────
  const proactiveMessage = useCallback(() => {
    const { activeId, isStreaming, aiProvider, geminiModel } = state;
    if (!activeId || isStreaming) return;

    const t = now();
    const aiMsgId = generateId('ai-proactive');
    const modelName = resolveModelName(aiProvider, geminiModel);

    const aiMsg: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      time: t,
      model: modelName,
      isStreaming: true,
    };

    dispatch({ type: 'ADD_AI_MESSAGE', convId: activeId, aiMsg });

    const boredomPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: [
          '당신은 친근하고 따뜻한 AI 어시스턴트입니다.',
          '사용자가 화면을 계속 두드리고 있습니다. 심심하신지 물어보고 대화를 유도해주세요.',
          '1-2문장으로 짧고 자연스럽게 한국어로 말해주세요.',
        ].join(' '),
      },
      { role: 'user' as const, content: '(화면 반복 클릭)' },
    ];

    executeStreaming(activeId, aiMsgId, boredomPrompt, aiProvider, geminiModel);
  }, [state, executeStreaming]);

  return (
    <ChatContext.Provider
      value={{ state, dispatch, startChat, sendMessage, cancelStreaming, editMessage, proactiveMessage }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ─── 컨텍스트 접근 훅 ─────────────────────────────────────────────────────────

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within <ChatProvider>');
  return ctx;
}
