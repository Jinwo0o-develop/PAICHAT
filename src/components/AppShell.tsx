import { useChat } from '../hooks/useChat.ts';
import Sidebar from './sidebar/Sidebar.tsx';
import ChatArea from './chat/ChatArea.tsx';
import WelcomeScreen from './welcome/WelcomeScreen.tsx';
import PromptDetailView from './prompt/PromptDetailView.tsx';
import PromptsManagerView from './prompt/PromptsManagerView.tsx';

/** 앱 레이아웃 쉘: Sidebar + 메인 컨텐츠 조합 */
export default function AppShell() {
  const { view, activeConversation, activeId } = useChat();

  // view 또는 activeId 가 바뀔 때마다 key 변경 → 페이지 트랜지션 재생
  const viewKey = view === 'chat' ? `chat-${activeId ?? ''}` : view;

  const renderMain = () => {
    if (view === 'chat' && activeConversation) {
      return <ChatArea conversation={activeConversation} />;
    }
    if (view === 'prompt') {
      return <PromptDetailView />;
    }
    if (view === 'prompts-list') {
      return <PromptsManagerView />;
    }
    return <WelcomeScreen />;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans h-screen flex overflow-hidden text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div key={viewKey} className="flex-1 flex overflow-hidden animate-page-enter">
        {renderMain()}
      </div>
    </div>
  );
}
