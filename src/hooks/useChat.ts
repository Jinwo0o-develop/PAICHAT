import { useCallback } from 'react';
import { useChatContext } from '../contexts/chat/index.ts';
import type { ChatAction } from '../contexts/chat/index.ts';
import type { Dispatch } from 'react';
import type { AIProvider, GeminiModel } from '../types/index.ts';

/**
 * 컴포넌트용 편의 훅.
 * ChatContext의 raw dispatch 대신 의미 있는 메서드 이름으로 액션 노출.
 */
export function useChat() {
  const { state, dispatch, startChat, sendMessage, cancelStreaming, editMessage, proactiveMessage } = useChatContext();

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeId) ?? null;

  const selectConversation = useCallback(
    (id: string) => dispatch({ type: 'SELECT_CONVERSATION', id }),
    [dispatch],
  );

  const selectPrompt = useCallback(
    (promptId: string) => dispatch({ type: 'SELECT_PROMPT', promptId }),
    [dispatch],
  );

  const selectPromptsList = useCallback(
    () => dispatch({ type: 'SELECT_PROMPTS_LIST' }),
    [dispatch],
  );

  const newChat = useCallback(
    () => dispatch({ type: 'NEW_CHAT' }),
    [dispatch],
  );

  const deleteConversation = useCallback(
    (id: string) => dispatch({ type: 'DELETE_CONVERSATION', id }),
    [dispatch],
  );

  const deleteConversationsBefore = useCallback(
    (cutoffMs: number) => dispatch({ type: 'DELETE_CONVERSATIONS_BEFORE', cutoffMs }),
    [dispatch],
  );

  const pinConversation = useCallback(
    (id: string) => dispatch({ type: 'PIN_CONVERSATION', id }),
    [dispatch],
  );

  const renameConversation = useCallback(
    (id: string, title: string) => dispatch({ type: 'RENAME_CONVERSATION', id, title }),
    [dispatch],
  );

  const toggleSidebar = useCallback(
    () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    [dispatch],
  );

  const toggleEtiquette = useCallback(
    (convId: string) => dispatch({ type: 'TOGGLE_ETIQUETTE', convId }),
    [dispatch],
  );

  const setModel = useCallback(
    (provider: AIProvider, geminiModel: GeminiModel) =>
      dispatch({ type: 'SET_MODEL', provider, geminiModel }),
    [dispatch],
  );

  const setEtiquetteModel = useCallback(
    (provider: AIProvider, geminiModel: GeminiModel) =>
      dispatch({ type: 'SET_ETIQUETTE_MODEL', provider, geminiModel }),
    [dispatch],
  );

  const clearSuggestions = useCallback(
    () => dispatch({ type: 'CLEAR_SUGGESTIONS' }),
    [dispatch],
  );

  const rateMessage = useCallback(
    (msgId: string, rating: 'good' | 'bad' | null) => {
      if (!state.activeId) return;
      dispatch({ type: 'RATE_MESSAGE', convId: state.activeId, msgId, rating });
    },
    [dispatch, state.activeId],
  );

  const isEtiquetteEnabled = state.activeId
    ? (state.etiquetteMap[state.activeId] ?? false)
    : false;

  return {
    // 상태
    conversations: state.conversations,
    activeConversation,
    activeId: state.activeId,
    activePromptId: state.activePromptId,
    view: state.view,
    isSidebarOpen: state.isSidebarOpen,
    isStreaming: state.isStreaming,
    isEtiquetteEnabled,
    aiProvider: state.aiProvider,
    geminiModel: state.geminiModel,
    etiquetteProvider: state.etiquetteProvider,
    etiquetteGeminiModel: state.etiquetteGeminiModel,
    suggestedReplies: state.suggestedReplies,
    // 액션
    startChat,
    sendMessage,
    cancelStreaming,
    editMessage,
    proactiveMessage,
    selectConversation,
    selectPrompt,
    selectPromptsList,
    newChat,
    deleteConversation,
    deleteConversationsBefore,
    pinConversation,
    renameConversation,
    toggleSidebar,
    toggleEtiquette,
    setModel,
    setEtiquetteModel,
    clearSuggestions,
    rateMessage,
    dispatch: dispatch as Dispatch<ChatAction>,
  };
}
