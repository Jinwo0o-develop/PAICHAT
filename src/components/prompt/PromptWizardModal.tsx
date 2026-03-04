import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Save, Sparkles, Send } from 'lucide-react';
import { AIServiceFactory } from '../../services/ai/index.ts';
import { useChatContext } from '../../contexts/chat/index.ts';
import { WIZARD_SYSTEM_PROMPTS } from '../../constants/wizardModules.ts';
import type { ChatMessage } from '../../types/index.ts';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface WizardMsg {
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const STEP_INFO = [
  { label: '정보 수집', hint: 'AI가 질문을 통해 원하는 결과물을 파악합니다.' },
  { label: '전략 수립', hint: 'AI가 최적의 프롬프트 기법을 결정합니다.' },
  { label: '프롬프트 생성', hint: 'AI가 완성된 프롬프트를 생성합니다.' },
] as const;

/** 첫 번째 코드 블록(```) 안의 내용 추출 */
function extractCodeBlock(text: string): string {
  const match = text.match(/```(?:\w+\n|[^\n]*\n)?([\s\S]*?)```/);
  return match ? match[1].trim() : '';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onCreate: (name: string, description: string, content: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * 3단계 프롬프트 빌더 파이프라인 위저드.
 * Step 0 (Extraction) → Step 1 (Technique) → Step 2 (Generator)
 */
export default function PromptWizardModal({ onClose, onCreate }: Props) {
  const { state } = useChatContext();
  const { aiProvider, geminiModel } = state;

  const [step, setStep] = useState(0);
  // 각 step의 표시용 메시지 (숨김 트리거 제외)
  const [stepMessages, setStepMessages] = useState<WizardMsg[][]>([[], [], []]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // 각 step의 마지막 AI 응답 전체 텍스트
  const [results, setResults] = useState(['', '', '']);

  // 저장 폼
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // 각 step 자동 시작 중복 방지
  const startedRef = useRef([false, false, false]);

  const currentMessages = stepMessages[step];
  const lastAiMsg = [...currentMessages].reverse().find((m) => m.role === 'ai');

  // Step 0 완료 조건: AI가 [Extraction Result] 출력 OR 사용자가 3번 이상 답변
  const userMsgCount0 = stepMessages[0].filter((m) => m.role === 'user').length;
  const canGoStep1 =
    !isStreaming &&
    step === 0 &&
    !!lastAiMsg &&
    !lastAiMsg.isStreaming &&
    (lastAiMsg.content.includes('[Extraction Result]') || userMsgCount0 >= 3);

  // Step 1 완료 조건: AI 응답 완료
  const canGoStep2 =
    !isStreaming &&
    step === 1 &&
    !!lastAiMsg &&
    !lastAiMsg.isStreaming &&
    lastAiMsg.content.length > 30;

  // Step 2 완료 조건: 코드 블록 추출 성공
  const generatedPrompt = step === 2 ? extractCodeBlock(results[2]) : '';
  const canSave = !isStreaming && step === 2 && generatedPrompt.length > 0;

  // ── 스크롤 유지 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // ── AI 스트리밍 핵심 함수 ────────────────────────────────────────────────────
  const streamAI = useCallback(
    (targetStep: number, history: ChatMessage[]) => {
      abortRef.current?.abort();
      setIsStreaming(true);

      const fullHistory: ChatMessage[] = [
        { role: 'system', content: WIZARD_SYSTEM_PROMPTS[targetStep] },
        ...history,
      ];

      // 빈 스트리밍 AI 메시지 추가
      setStepMessages((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[targetStep] = [
          ...next[targetStep],
          { role: 'ai', content: '', isStreaming: true },
        ];
        return next;
      });

      const service = AIServiceFactory.getService(aiProvider, geminiModel);
      let accumulated = '';

      const onToken = (token: string) => {
        accumulated += token;
        setStepMessages((prev) => {
          const next = prev.map((arr) => [...arr]);
          const msgs = [...next[targetStep]];
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: accumulated };
          next[targetStep] = msgs;
          return next;
        });
      };

      const onDone = () => {
        setIsStreaming(false);
        setStepMessages((prev) => {
          const next = prev.map((arr) => [...arr]);
          const msgs = [...next[targetStep]];
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], isStreaming: false };
          next[targetStep] = msgs;
          return next;
        });
        setResults((prev) => {
          const next = [...prev];
          next[targetStep] = accumulated;
          return next;
        });
      };

      const onError = (err: Error) => {
        setIsStreaming(false);
        setStepMessages((prev) => {
          const next = prev.map((arr) => [...arr]);
          const msgs = [...next[targetStep]];
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            content: `⚠️ 오류가 발생했습니다: ${err.message}`,
            isStreaming: false,
          };
          next[targetStep] = msgs;
          return next;
        });
      };

      abortRef.current = service.streamChat(fullHistory, onToken, onDone, onError);
    },
    [aiProvider, geminiModel],
  );

  // ── Step 0 자동 시작 (마운트 시) ─────────────────────────────────────────────
  useEffect(() => {
    if (!startedRef.current[0]) {
      startedRef.current[0] = true;
      streamAI(0, [
        { role: 'user', content: '안녕하세요. 프롬프트를 만들고 싶어요. 도와주세요.' },
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 정리 ────────────────────────────────────────────────────────────────────
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // ── Step 0 사용자 메시지 전송 ────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!input.trim() || isStreaming || step !== 0) return;
    const userContent = input.trim();
    setInput('');

    setStepMessages((prev) => {
      const next = prev.map((arr) => [...arr]);
      next[0] = [...next[0], { role: 'user', content: userContent }];
      return next;
    });

    // 숨김 트리거 + 이전 메시지 + 새 사용자 메시지로 히스토리 구성
    const history: ChatMessage[] = [
      { role: 'user', content: '안녕하세요. 프롬프트를 만들고 싶어요. 도와주세요.' },
      ...currentMessages.map((m) => ({
        role: (m.role === 'ai' ? 'assistant' : 'user') as ChatMessage['role'],
        content: m.content,
      })),
      { role: 'user', content: userContent },
    ];

    streamAI(0, history);
  }, [input, isStreaming, step, currentMessages, streamAI]);

  // ── Step 1으로 이동 ──────────────────────────────────────────────────────────
  const goToStep1 = useCallback(() => {
    const extractionText = results[0] || lastAiMsg?.content || '';
    setStep(1);
    if (!startedRef.current[1]) {
      startedRef.current[1] = true;
      setTimeout(() => {
        streamAI(1, [{ role: 'user', content: extractionText }]);
      }, 80);
    }
  }, [results, lastAiMsg, streamAI]);

  // ── Step 2로 이동 ────────────────────────────────────────────────────────────
  const goToStep2 = useCallback(() => {
    const techniqueText = results[1] || lastAiMsg?.content || '';
    const combined = `다음은 정보 수집(1단계)과 전략 수립(2단계) 결과입니다.\n\n${results[0]}\n\n---\n\n${techniqueText}`;
    setStep(2);
    if (!startedRef.current[2]) {
      startedRef.current[2] = true;
      setTimeout(() => {
        streamAI(2, [{ role: 'user', content: combined }]);
      }, 80);
    }
  }, [results, lastAiMsg, streamAI]);

  // ── 저장 ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    onCreate(saveName.trim(), saveDesc.trim(), generatedPrompt);
    onClose();
  }, [saveName, saveDesc, generatedPrompt, onCreate, onClose]);

  // ─── 렌더 ────────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-modal-backdrop">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[660px] max-w-[95vw] h-[82vh] flex flex-col animate-modal-panel">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #44ccfd, #6366f1)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                프롬프트 쉽게 만들기
              </h3>
              <p className="text-[11px] text-slate-400">{STEP_INFO[step].hint}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── 스텝 진행 바 ── */}
        <div className="px-6 py-3 shrink-0">
          <div className="flex items-center gap-1.5">
            {STEP_INFO.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                    i < step
                      ? 'bg-emerald-400 text-white'
                      : i === step
                        ? 'text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                  style={
                    i === step
                      ? { background: 'linear-gradient(135deg, #44ccfd, #6366f1)' }
                      : undefined
                  }
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs font-medium truncate ${
                    i === step ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full ${
                      i < step ? 'bg-emerald-300' : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 메시지 영역 ── */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 custom-scrollbar border-t border-slate-50 dark:border-slate-700/50">
          {currentMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-7 h-7 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">AI가 준비 중입니다...</span>
              </div>
            </div>
          )}

          {currentMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-slate-50 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                }`}
                style={
                  msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #44ccfd, #6366f1)' }
                    : undefined
                }
              >
                {msg.content}
                {msg.isStreaming && !msg.content && (
                  <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── 하단 액션 ── */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0 space-y-2">

          {/* 저장 폼 */}
          {showSaveForm ? (
            <div className="space-y-2.5">
              <input
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="프롬프트 이름 *"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <input
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="간략한 설명 (선택)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-5 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-40 flex items-center gap-1.5 shadow-md transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #10b981, #44ccfd)' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  저장하기
                </button>
              </div>
            </div>
          ) : step === 0 ? (
            /* Step 0: 입력창 + 다음 단계 버튼 */
            <>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={isStreaming}
                  placeholder="AI의 질문에 답변하세요... (Shift+Enter: 줄바꿈)"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="px-3 rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #44ccfd, #6366f1)' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {canGoStep1 && (
                <button
                  onClick={goToStep1}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #44ccfd, #6366f1)' }}
                >
                  2단계: 전략 수립으로 이동
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : step === 1 ? (
            /* Step 1: 자동 처리, 다음 단계 버튼 */
            isStreaming ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-1.5">
                <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                AI가 전략을 수립하고 있습니다...
              </div>
            ) : canGoStep2 ? (
              <button
                onClick={goToStep2}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
              >
                3단계: 프롬프트 생성으로 이동
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null
          ) : (
            /* Step 2: 생성 중 or 저장 버튼 */
            isStreaming ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-1.5">
                <div className="w-3.5 h-3.5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                프롬프트를 생성하고 있습니다...
              </div>
            ) : canSave ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md"
                style={{ background: 'linear-gradient(135deg, #10b981, #44ccfd)' }}
              >
                <Save className="w-4 h-4" />
                이 프롬프트 저장하기
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
