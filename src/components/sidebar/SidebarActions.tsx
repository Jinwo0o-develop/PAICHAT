import { PlusCircle, Search, Image as ImageIcon } from 'lucide-react';
import { useChat } from '../../hooks/useChat.ts';

/** 새 채팅·검색·이미지 버튼 그리드 */
export default function SidebarActions() {
  const { newChat } = useChat();

  return (
    <div className="p-4 grid grid-cols-3 gap-3">
      <button
        onClick={newChat}
        className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900 h-full"
      >
        <PlusCircle className="w-8 h-8 text-primary" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-center">새 채팅</span>
      </button>
      <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900 h-full">
        <Search className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-center">검색</span>
      </button>
      <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900 h-full">
        <ImageIcon className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-center">생성된 이미지</span>
      </button>
    </div>
  );
}
