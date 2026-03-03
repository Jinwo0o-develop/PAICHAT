import { Menu, PanelLeft, Zap } from 'lucide-react';
import { useChat } from '../../hooks/useChat.ts';
import { cn } from '../../lib/cn.ts';
import { LOGO_URL } from '../../constants/initialData.ts';

/** 사이드바 최상단: 로고 + 토글 버튼 */
export default function SidebarHeader() {
  const { isSidebarOpen, toggleSidebar, newChat } = useChat();

  return (
    <header className="flex items-center gap-2 px-4 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 min-h-[84px]">
      <button
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
        className="group p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
      >
        <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200 group-hover:hidden" />
        <PanelLeft className="w-6 h-6 text-primary hidden group-hover:block" />
      </button>

      <button
        onClick={newChat}
        aria-label="홈으로 이동"
        className={cn(
          'flex items-center gap-3 overflow-hidden transition-all duration-300 hover:opacity-75',
          isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none',
        )}
      >
        <img src={LOGO_URL} alt="PAI" className="h-14 w-auto object-contain shrink-0" />
        <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap">PAI Chat</h1>
      </button>

      {isSidebarOpen && (
        <div
          className="ml-auto w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#44ccfd' }}
        >
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
      )}
    </header>
  );
}
