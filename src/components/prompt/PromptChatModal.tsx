import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import type { Prompt } from '../../types/prompt.ts';
import { LOGO_URL } from '../../constants/initialData.ts';
import { useChat } from '../../hooks/useChat.ts';

interface Props {
  prompt: Prompt;
  onClose: () => void;
  onStart: (promptId: string) => void;
}

export default function PromptChatModal({ prompt, onClose, onStart }: Props) {
  const { startChat } = useChat();
  const [userInput, setUserInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleStart = () => {
    if (!userInput.trim()) return;
    onStart(prompt.id);
    startChat(userInput.trim(), [], prompt.content);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[540px] max-w-[92vw]">

        {/* 헤더: 로고 + 프롬프트 정보 */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          {/* 앱 로고 */}
          <div className="shrink-0">
            <img
              src={LOGO_URL}
              alt="PAI"
              className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-100 dark:border-slate-700 shadow-md p-2"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
              {prompt.name}
            </h3>
            {prompt.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {prompt.description}
              </p>
            )}
            {/* 사용 목록 */}
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                사용 {prompt.usageCount}회
              </span>
              {prompt.lastUsedAt && (
                <span className="text-[11px] text-slate-400">
                  최근 {Math.floor((Date.now() - prompt.lastUsedAt) / 86_400_000) === 0
                    ? '오늘'
                    : `${Math.floor((Date.now() - prompt.lastUsedAt) / 86_400_000)}일 전`}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 프롬프트 내용 미리보기 */}
        <div className="mx-6 mb-4 p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-700/40 dark:to-primary/10 border border-slate-100 dark:border-slate-600">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            AI 역할 설정
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            {prompt.content}
          </p>
        </div>

        {/* 입력창 */}
        <div className="px-6 pb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            무엇이 궁금하신가요?
          </label>
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart(); }
              if (e.key === 'Escape') onClose();
            }}
            placeholder="이 프롬프트로 시작할 내용을 입력하세요... (Shift+Enter: 줄바꿈)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all leading-relaxed"
          />

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleStart}
              disabled={!userInput.trim()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              대화 시작
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
