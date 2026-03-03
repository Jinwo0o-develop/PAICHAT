import type { AppState, AppView } from '../../types/index.ts';
import type { ChatAction } from './actions.ts';

// ─── State 패턴: 순수 상태 변환 함수 ─────────────────────────────────────────

export function chatReducer(state: AppState, action: ChatAction): AppState {
  switch (action.type) {
    case 'START_CONVERSATION':
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
        activeId: action.conversation.id,
        activePromptId: null,
        view: 'chat',
        suggestedReplies: null,
      };

    case 'SELECT_CONVERSATION':
      return { ...state, activeId: action.id, activePromptId: null, view: 'chat', suggestedReplies: null };

    case 'SELECT_PROMPT':
      return { ...state, activeId: null, activePromptId: action.promptId, view: 'prompt', suggestedReplies: null };

    case 'SELECT_PROMPTS_LIST':
      return { ...state, activeId: null, activePromptId: null, view: 'prompts-list', suggestedReplies: null };

    case 'NEW_CHAT':
      return { ...state, activeId: null, activePromptId: null, view: 'welcome', suggestedReplies: null };

    case 'DELETE_CONVERSATION': {
      const next = state.conversations.filter((c) => c.id !== action.id);
      const newActive = state.activeId === action.id ? null : state.activeId;
      return {
        ...state,
        conversations: next,
        activeId: newActive,
        activePromptId: null,
        view: (newActive ? 'chat' : 'welcome') as AppView,
        suggestedReplies: null,
      };
    }

    case 'DELETE_CONVERSATIONS_BEFORE': {
      const next = state.conversations.filter(
        (c) => (c.createdAt ?? 0) >= action.cutoffMs,
      );
      const newActive = next.find((c) => c.id === state.activeId)
        ? state.activeId
        : null;
      return {
        ...state,
        conversations: next,
        activeId: newActive,
        activePromptId: null,
        view: (newActive ? 'chat' : 'welcome') as AppView,
        suggestedReplies: null,
      };
    }

    case 'PIN_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, pinned: !c.pinned } : c,
        ),
      };

    case 'RENAME_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, title: action.title } : c,
        ),
      };

    case 'APPEND_TOKEN':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.msgId ? { ...m, content: m.content + action.token } : m,
                ),
              }
            : c,
        ),
      };

    case 'FINISH_STREAMING':
      return {
        ...state,
        isStreaming: false,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.msgId ? { ...m, isStreaming: false } : m,
                ),
              }
            : c,
        ),
      };

    case 'CANCEL_STREAMING':
      return {
        ...state,
        isStreaming: false,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? { ...c, messages: c.messages.filter((m) => m.id !== action.msgId) }
            : c,
        ),
      };

    case 'STREAM_ERROR':
      return {
        ...state,
        isStreaming: false,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.msgId
                    ? { ...m, content: `\u26A0\uFE0F 연결 오류: ${action.error}`, isStreaming: false }
                    : m,
                ),
              }
            : c,
        ),
      };

    case 'ADD_MESSAGES':
      return {
        ...state,
        suggestedReplies: null,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: [...c.messages, action.userMsg, action.aiMsg],
                preview: action.userMsg.content,
                time: action.userMsg.time,
              }
            : c,
        ),
      };

    case 'REPLACE_FROM_MSG':
      return {
        ...state,
        isStreaming: false,
        suggestedReplies: null,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: [
                  ...c.messages.slice(0, action.msgIndex),
                  action.userMsg,
                  action.aiMsg,
                ],
                preview: action.userMsg.content,
              }
            : c,
        ),
      };

    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? { ...c, messages: [...c.messages, action.aiMsg] }
            : c,
        ),
      };

    case 'UPDATE_REWRITTEN_CONTENT':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.msgId ? { ...m, rewrittenContent: action.content } : m,
                ),
              }
            : c,
        ),
      };

    case 'RATE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.msgId ? { ...m, rating: action.rating ?? undefined } : m,
                ),
              }
            : c,
        ),
      };

    case 'TOGGLE_ETIQUETTE':
      return {
        ...state,
        etiquetteMap: {
          ...state.etiquetteMap,
          [action.convId]: !(state.etiquetteMap[action.convId] ?? false),
        },
      };

    case 'SET_SUGGESTIONS':
      if (state.activeId !== action.convId) return state;
      return { ...state, suggestedReplies: action.replies };

    case 'CLEAR_SUGGESTIONS':
      return { ...state, suggestedReplies: null };

    case 'SET_MODEL':
      return { ...state, aiProvider: action.provider, geminiModel: action.geminiModel };

    case 'SET_ETIQUETTE_MODEL':
      return { ...state, etiquetteProvider: action.provider, etiquetteGeminiModel: action.geminiModel };

    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.value };

    default:
      return state;
  }
}
