import { useState } from 'react';
import { Lightbulb, Send, X } from 'lucide-react';

interface Props {
  replies: string[];
  onSend: (content: string) => void;
  onDismiss: () => void;
}

/**
 * 에티켓 모드: AI 답변 후 표시되는 선택지 3개.
 * 라디오 버튼으로 하나 선택 후 전송 버튼 클릭.
 */
export default function SuggestedReplies({ replies, onSend, onDismiss }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSend = () => {
    if (!selected) return;
    onSend(selected);
    setSelected(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            선택지
          </span>
        </div>
        <button
          onClick={onDismiss}
          aria-label="선택지 닫기"
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 라디오 선택지 */}
      <div className="space-y-2">
        {replies.map((reply, idx) => (
          <label
            key={idx}
            className={[
              'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border',
              selected === reply
                ? 'bg-primary/10 border-primary/40 dark:border-primary/50'
                : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50',
            ].join(' ')}
          >
            <input
              type="radio"
              name="suggested-reply"
              value={reply}
              checked={selected === reply}
              onChange={() => setSelected(reply)}
              className="mt-0.5 shrink-0 accent-primary"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {reply}
            </span>
          </label>
        ))}
      </div>

      {/* 전송 버튼 */}
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSend}
          disabled={!selected}
          className="flex items-center gap-2 bg-primary text-white rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/20"
        >
          <Send className="w-4 h-4" />
          전송
        </button>
      </div>
    </div>
  );
}
