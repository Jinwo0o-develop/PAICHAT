import type { KeyboardEvent, MouseEvent, ElementType } from 'react';
import { MessageSquare, Code, Languages, MoreVertical, Pin } from 'lucide-react';
import type { Conversation, ConversationIconType } from '../../types/index.ts';
import { cn } from '../../lib/cn.ts';
import { relativeTime } from '../../lib/time.ts';

const ICON_MAP: Record<ConversationIconType, ElementType> = {
  message: MessageSquare,
  code: Code,
  languages: Languages,
  avatar: MessageSquare,
};

interface Props {
  conversation: Conversation;
  isActive: boolean;
  isMenuOpen: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: (id: string) => void;
  onRenameStart: (id: string) => void;
  onRenameChange: (value: string) => void;
  onRenameCommit: (id: string) => void;
  onRenameKeyDown: (e: KeyboardEvent<HTMLInputElement>, id: string) => void;
  onMenuOpen: (e: MouseEvent<HTMLButtonElement>, id: string) => void;
}

/** 사이드바의 단일 대화 항목 */
export default function ConversationItem({
  conversation: conv,
  isActive,
  isMenuOpen,
  isRenaming,
  renameValue,
  onSelect,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameKeyDown,
  onMenuOpen,
}: Props) {
  const Icon = ICON_MAP[conv.iconType] ?? MessageSquare;

  return (
    <div
      onClick={() => !isRenaming && onSelect(conv.id)}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700',
      )}
    >
      {/* 아이콘 */}
      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        {conv.iconType === 'avatar' ? (
          <div
            className="w-full h-full rounded-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://picsum.photos/seed/user/100/100')" }}
          />
        ) : (
          <Icon className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {/* 제목 + 미리보기 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5 gap-1">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => onRenameKeyDown(e, conv.id)}
              onBlur={() => onRenameCommit(conv.id)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-b border-primary focus:outline-none text-sm font-medium text-slate-900 dark:text-white"
            />
          ) : (
            <p
              onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(conv.id); }}
              title="더블클릭하여 제목 수정"
              className={cn(
                'text-sm truncate cursor-text select-none',
                isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-900 dark:text-white',
              )}
            >
              {conv.pinned && <Pin className="inline w-3 h-3 text-primary mr-1 -mt-0.5" />}
              {conv.title}
            </p>
          )}
          <span className="text-[10px] text-slate-500 shrink-0">
            {conv.createdAt ? relativeTime(conv.createdAt) : conv.time}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.preview}</p>
      </div>

      {/* 더보기 버튼 */}
      {!isRenaming && (
        <button
          onClick={(e) => onMenuOpen(e, conv.id)}
          aria-label="대화 옵션"
          className={cn(
            'shrink-0 p-1 rounded-lg transition-all',
            isMenuOpen
              ? 'opacity-100 bg-slate-200 dark:bg-slate-700'
              : 'opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700',
          )}
        >
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>
      )}
    </div>
  );
}
