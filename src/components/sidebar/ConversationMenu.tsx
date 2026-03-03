import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pin, PinOff, PenLine, Trash2 } from 'lucide-react';
import type { Conversation } from '../../types/index.ts';

export interface MenuPosition {
  id: string;
  x: number;
  y: number;
}

interface Props {
  menuPos: MenuPosition;
  conversation: Conversation | undefined;
  onClose: () => void;
  onPin: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
}

/**
 * 대화 항목 우클릭 컨텍스트 메뉴.
 * createPortal로 body에 렌더링하여 z-index 충돌 방지.
 */
export default function ConversationMenu({
  menuPos,
  conversation,
  onClose,
  onPin,
  onRename,
  onDelete,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: menuPos.x, top: menuPos.y }}
      className="z-[9999] min-w-[160px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 overflow-hidden"
    >
      <button
        onClick={() => { onPin(menuPos.id); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {conversation?.pinned ? (
          <><PinOff className="w-4 h-4 text-slate-400" />고정 해제</>
        ) : (
          <><Pin className="w-4 h-4 text-primary" />고정</>
        )}
      </button>

      <button
        onClick={() => {
          if (conversation) onRename(conversation.id, conversation.title);
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <PenLine className="w-4 h-4 text-slate-400" />
        이름 변경
      </button>

      <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

      <button
        onClick={() => { onDelete(menuPos.id); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        삭제
      </button>
    </div>,
    document.body,
  );
}
