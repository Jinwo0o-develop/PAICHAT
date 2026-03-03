import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { Conversation } from '../../types/index.ts';
import { useChat } from '../../hooks/useChat.ts';

interface Props {
  conversation: Conversation;
}

/** 채팅 화면 상단: 대화 제목 (클릭하여 수정 가능) */
export default function ChatHeader({ conversation }: Props) {
  const { renameConversation } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부에서 제목이 바뀌면(자동 생성 등) 동기화
  useEffect(() => {
    if (!isEditing) setDraft(conversation.title);
  }, [conversation.title, isEditing]);

  const startEdit = () => {
    setDraft(conversation.title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== conversation.title) {
      renameConversation(conversation.id, trimmed);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(conversation.title);
    setIsEditing(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 h-20 px-8 flex items-center z-10 bg-gradient-to-b from-background-light to-transparent dark:from-background-dark">
      <div className="flex items-center gap-3 min-w-0">
        {isEditing ? (
          /* 수정 모드 */
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') cancel();
              }}
              onBlur={save}
              className="text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-primary focus:outline-none w-64 max-w-sm"
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); save(); }}
              aria-label="저장"
              className="p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); cancel(); }}
              aria-label="취소"
              className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* 표시 모드 */
          <div className="flex items-center gap-2 group">
            <h2
              onDoubleClick={startEdit}
              title="더블클릭하여 제목 수정"
              className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-md cursor-text select-none"
            >
              {conversation.title}
            </h2>
            <button
              onClick={startEdit}
              aria-label="제목 수정"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider border border-green-200 shrink-0">
              Active
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
