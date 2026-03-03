import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import type { Message } from '../../types/index.ts';
import { LOGO_URL } from '../../constants/initialData.ts';
import { useChat } from '../../hooks/useChat.ts';
import { cn } from '../../lib/cn.ts';

interface Props {
  message: Message;
}

/** AI 응답 말풍선. 스트리밍 중 점 애니메이션 → 커서 깜빡임. 완료 후 👍/👎 평가 버튼 표시. */
export default function AIMessage({ message: msg }: Props) {
  const { rateMessage, isStreaming } = useChat();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRate = (rating: 'good' | 'bad') => {
    // 같은 버튼 다시 누르면 취소
    rateMessage(msg.id, msg.rating === rating ? null : rating);
  };

  const showActions = !msg.isStreaming && !isStreaming && msg.content;

  return (
    <div className="flex gap-4 max-w-3xl animate-msg-left">
      <img
        src={LOGO_URL}
        alt="PAI"
        className="w-10 h-10 rounded-full object-contain shrink-0 shadow-md bg-white"
      />
      <div className="space-y-1">
        <span className="text-xs font-bold text-primary pl-1 block">PAI</span>
        <div className="group/bubble">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-r-2xl rounded-bl-2xl shadow-sm text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
            {msg.isStreaming && !msg.content ? (
              /* 응답 대기 중 — 점 세 개 애니메이션 */
              <span className="flex items-center gap-1 h-5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              </span>
            ) : (
              <p className="leading-relaxed whitespace-pre-wrap">
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-0.5 h-[1.1em] bg-slate-400 ml-0.5 align-middle animate-pulse" />
                )}
              </p>
            )}
          </div>

          {/* 액션 버튼: 복사 + 평가 (스트리밍 완료 후 호버 시) */}
          {showActions && (
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              {/* 복사 */}
              <button
                onClick={handleCopy}
                aria-label="복사"
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>

              <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              {/* 좋아요 */}
              <button
                onClick={() => handleRate('good')}
                aria-label="좋은 답변"
                title="좋은 답변"
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] transition-colors',
                  msg.rating === 'good'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 opacity-100'
                    : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                )}
              >
                <ThumbsUp className={cn('w-3.5 h-3.5', msg.rating === 'good' && 'fill-current')} />
                {msg.rating === 'good' && <span>좋아요</span>}
              </button>

              {/* 싫어요 */}
              <button
                onClick={() => handleRate('bad')}
                aria-label="아쉬운 답변"
                title="아쉬운 답변"
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] transition-colors',
                  msg.rating === 'bad'
                    ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 opacity-100'
                    : 'text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
                )}
              >
                <ThumbsDown className={cn('w-3.5 h-3.5', msg.rating === 'bad' && 'fill-current')} />
                {msg.rating === 'bad' && <span>아쉬워요</span>}
              </button>
            </div>
          )}

          {/* 평가 완료 시 항상 표시 (호버 불필요) */}
          {!showActions && msg.rating && (
            <div className="flex items-center gap-1 mt-1">
              {msg.rating === 'good' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                  <ThumbsUp className="w-3 h-3 fill-current" />
                  좋아요
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30">
                  <ThumbsDown className="w-3 h-3 fill-current" />
                  아쉬워요
                </span>
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-400 pl-1 block">{msg.time}</span>
      </div>
    </div>
  );
}
