import { useState, useRef } from 'react';
import { useChat } from '../../hooks/useChat.ts';
import { cn } from '../../lib/cn.ts';
import ChatInput from '../common/ChatInput.tsx';
import ModelSelector from './ModelSelector.tsx';
import SuggestedReplies from './SuggestedReplies.tsx';
import EtiquettePanel from './EtiquettePanel.tsx';

/**
 * 레이아웃:
 *   [선택지 카드]
 *   [에티켓 AI 모델]  [AI ON/OFF]
 *   [      ChatInput               ]
 *   [면책 문구]    [상대 AI 모델]
 */
export default function ChatFooter() {
  const {
    sendMessage, isStreaming, cancelStreaming,
    isEtiquetteEnabled, toggleEtiquette, activeId, activeConversation,
    etiquetteProvider, etiquetteGeminiModel, setEtiquetteModel,
    suggestedReplies, clearSuggestions,
  } = useChat();

  const [injectedValue, setInjectedValue] = useState('');
  const [toggleReason, setToggleReason] = useState('');
  const reasonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showReason = (msg: string) => {
    setToggleReason(msg);
    if (reasonTimer.current) clearTimeout(reasonTimer.current);
    reasonTimer.current = setTimeout(() => setToggleReason(''), 4500);
  };

  const handleToggle = () => {
    // ── ON → OFF: 항상 허용 ────────────────────────────────────────────
    if (isEtiquetteEnabled) {
      if (activeId) toggleEtiquette(activeId);
      return;
    }

    // ── OFF → ON: 조건 검사 ────────────────────────────────────────────
    if (!activeId) {
      showReason(
        '활성화된 대화가 없습니다.\n' +
        '에티켓 AI는 현재 대화의 맥락을 분석하여 더 정중하고 자연스러운 표현을 제안해주는 기능입니다. ' +
        '새 채팅을 시작하거나 기존 대화를 선택한 뒤 다시 시도해주세요.',
      );
      return;
    }
    if (isStreaming) {
      showReason(
        'AI가 현재 답변을 생성하고 있습니다.\n' +
        '에티켓 AI는 완성된 대화 내용을 기반으로 동작합니다. ' +
        '답변이 완전히 완료된 후에 켜주시면 더 정확한 표현을 제안받을 수 있습니다.',
      );
      return;
    }
    const msgCount = (activeConversation?.messages ?? []).filter((m) => m.content).length;
    if (msgCount === 0) {
      showReason(
        '아직 대화 내용이 없습니다.\n' +
        '에티켓 AI는 기존 대화의 흐름과 상대방의 말투를 분석해 상황에 맞는 표현을 추천해드립니다. ' +
        '먼저 대화를 몇 마디 나눈 뒤 켜주시면 훨씬 정확한 제안을 받으실 수 있습니다.',
      );
      return;
    }
    if (etiquetteProvider === 'gemini' && !etiquetteGeminiModel) {
      showReason(
        '에티켓 AI에 사용할 모델이 선택되지 않았습니다.\n' +
        'AI ON/OFF 버튼 왼쪽의 모델 선택기(칩 버튼)에서 Gemini 모델을 먼저 선택해주세요. ' +
        '모델 선택 후 다시 켜시면 정상적으로 작동합니다.',
      );
      return;
    }
    toggleEtiquette(activeId);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-light via-background-light/90 to-transparent dark:from-background-dark dark:via-background-dark/90">
      {/* 에티켓 패널 (AI ON 시에만 표시) */}
      {isEtiquetteEnabled && (
        <EtiquettePanel onSend={setInjectedValue} />
      )}

      <div className="max-w-4xl mx-auto">

        {/* 선택지 카드 */}
        {isEtiquetteEnabled && suggestedReplies && suggestedReplies.length > 0 && (
          <SuggestedReplies
            replies={suggestedReplies}
            onSend={(content) => { void sendMessage(content); }}
            onDismiss={clearSuggestions}
          />
        )}

        {/* 에티켓 행: 교정 AI 모델 선택기 + ON/OFF 토글 */}
        <div className="flex justify-end items-center gap-2 mb-1">
          <ModelSelector
            direction="up"
            compact
            value={{ provider: etiquetteProvider, geminiModel: etiquetteGeminiModel }}
            onSelect={setEtiquetteModel}
          />
          <button
            onClick={handleToggle}
            aria-label={isEtiquetteEnabled ? '에티켓 모드 끄기' : '에티켓 모드 켜기'}
            className={cn(
              'group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              isEtiquetteEnabled
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400',
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                isEtiquetteEnabled
                  ? 'bg-white animate-pulse'
                  : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-emerald-400',
              )}
            />
            AI {isEtiquetteEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* 토글 거절 사유 */}
        {toggleReason && (
          <div className="flex justify-end mb-2 animate-fade-up">
            <div className="max-w-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-base shrink-0 mt-0.5">⚠</span>
                <p className="text-xs text-amber-800 dark:text-amber-300 whitespace-pre-line leading-relaxed">
                  {toggleReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 입력창 */}
        <ChatInput
          onSend={sendMessage}
          onCancel={cancelStreaming}
          isStreaming={isStreaming}
          etiquetteEnabled={isEtiquetteEnabled}
          injectedValue={injectedValue}
          onInjectedValueConsumed={() => setInjectedValue('')}
        />

        {/* 면책 문구 */}
        <p className="text-[10px] text-slate-400 text-center mt-2">
          AI는 실수를 할 수 있습니다. 중요한 정보는 직접 확인이 필요합니다.
        </p>

      </div>
    </div>
  );
}
