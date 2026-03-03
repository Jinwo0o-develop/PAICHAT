import { useMemo } from 'react';
import { useChat } from '../../hooks/useChat.ts';
import { cn } from '../../lib/cn.ts';
import SidebarHeader from './SidebarHeader.tsx';
import SidebarActions from './SidebarActions.tsx';
import PromptSection from './PromptSection.tsx';
import ConversationList from './ConversationList.tsx';

/** 사이드바 레이아웃 쉘: 헤더 + 액션 + 대화 목록 조합 */
export default function Sidebar() {
  const { conversations, activeId, isSidebarOpen } = useChat();

  // 고정 항목 먼저 표시 (useMemo로 불필요한 재정렬 방지)
  const sorted = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      }),
    [conversations],
  );

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full shrink-0 transition-all duration-300 overflow-hidden',
        isSidebarOpen ? 'w-[360px]' : 'w-16',
      )}
    >
      <SidebarHeader />

      <div
        className={cn(
          'flex-1 overflow-y-auto custom-scrollbar transition-all duration-200',
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <SidebarActions />
        <PromptSection />
        <ConversationList conversations={sorted} activeId={activeId} />
      </div>
    </aside>
  );
}
